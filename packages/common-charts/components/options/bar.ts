import { recursionObject, isObject } from '../utils/index.ts'
import echart from '../theme/theme.json'
import { getMarkLine, getTooltip, getToolBox, yAxis, axisLabel } from './common.ts'

// 定义 itemStyle 类
class itemStyle {
  normal: any // 或更具体的类型
  constructor({ options, seriesItem }) {
    this.normal = {
      label: {
        show: !options.hiddenLabel, // 是否隐藏文本
        position: seriesItem?.label?.position || options?.labelPosition || 'top', // 在上方显示
        textStyle: {
          color: echart.$fontColor || echart.fontColor, // 注意: mac 中无法获取 $变量, mac中直接通过变量名获取
          fontSize: 14,
        },
        formatter: function (params) {
          if (options.dataset) {
            // dataset 形式
            var data = params.data
            if (data[params.seriesName] === null || data[params.seriesName] < 1) return '' // 0不显示
            return data[params.seriesName] // 后续单位需根据不同情况换单位需传参
          } else if (options.labelFormatter) {
            // 传入自定义label formatter函数
            return options.labelFormatter(params)
          } else {
            return params.value
          }
        },
      },
    }
  }
}

/**
 * 获取条形图默认配置参数
 * @param { Object } options 实例配置参数：
 * {
 *      position: 'top', // 柱状图数字提示位置
 *      isCross: false, // 柱状图是否为横向,
 *      stackIndex: [1, 2], // 堆叠图形下标值
 *      stackLabel: ['label1','label1','label2','label2'] //堆叠图形 label ，相同 label 的图形堆叠在一起
 *      dataset: false, //源数据是否为 dataset 格式
 *      showAverage: true // 是否显示平均线
 * }
 * @param { Object } data 源数据
 */
class defaultOptTemp {
  option: any // 或更具体的类型
  constructor({ options, data }) {
    this.option = {
      toolbox: getToolBox(options),
      title: {
        // 标题
        text: options.title || null,
      },
      tooltip: getTooltip(options),
      legend: {
        top: 10,
        right: 75,
        padding: [0, 0, 0, 0],
        itemGap: 30,
        itemHeight: 3,
        textStyle: {
          color: echart.$fontColor || echart.fontColor, // 注意: mac 中无法获取 $变量, mac中直接通过变量名获取
          fontSize: 12,
        },
        show: true,
      },
      grid: {
        bottom: 30,
        top: 40,
        left: 25,
        right: 50,
        // grid.left grid.right grid.top grid.bottom grid.width grid.height 决定的是包括了坐标轴标签在内的所有内容所形成的矩形的位置
        // 常用于『防止标签溢出』的场景，标签溢出指的是，标签长度动态变化时，可能会溢出容器或者覆盖其他组件。
        containLabel: true,
      },
      dataset: (() => {
        if (options.dataset) {
          return {
            dimensions: (() => {
              return Object.keys(data[0])
            })(),
            source: data,
          }
        }
        return null
      })(),
      xAxis: {
        data: (() => {
          if (!options.dataset) {
            // 非数据集格式
            return data && data.xAxis
          }
        })(),
        splitLine: {
          show: options.isCross, // 去掉网格线分割
          lineStyle: {
            type: 'dashed',
            color: '#E8E8E8',
          },
        },
        type: 'category',
        axisLabel: {
          width: 120,
          hideOverlap: false,
          interval: 0,
          overflow: 'break',
          rotate: '10',
          align: 'center',
          verticalAlign: 'top',
        },
        axisLine: {
          lineStyle: {
            color: '#CCCCCC',
          },
        },
      },
      yAxis: options.yAxis || yAxis,
      series: (() => {
        // 数据源使用数据集格式时，series 转换
        if (options.dataset) {
          let seriesLen = 0
          if (data && data[0]) {
            seriesLen = isObject(data[0]) ? Object.keys(data[0]).length - 1 : data[0].length - 1
          }
          // eslint-disable-next-line new-cap
          const seriseArr: Array<any> = []
          for (let i = 0; i < seriesLen; i++) {
            seriseArr.push({
              type: 'bar',
              markLine: getMarkLine(options, data),
              barGap: '20%',
              barCategoryGap: '100%',
              stack: options.stackIndex && options.stackIndex.indexOf(i) > -1,
              // eslint-disable-next-line new-cap
              itemStyle: new itemStyle({ options }),
            })
          }

          return seriseArr
        } else {
          const sameStacksLabel = [] // 相同stack数据,用于判断
          if (!data) {
            return []
          } // 数据源使用常规数据格式时，series 转换
          data.series &&
            data.series.length > 0 &&
            data.series.forEach((item, index) => {
              item.type = item.type || 'bar'
              item.barMaxWidth = 38
              options.emphasisDsiabled
                ? null
                : (item['emphasis'] = {
                    focus: 'series',
                  })
              item.markLine = getMarkLine(options, data)
              // eslint-disable-next-line new-cap
              item.itemStyle = new itemStyle({ options, seriesItem: item })
              // 使用 stackIndex 指定堆叠下标
              if (options.stackIndex) {
                item.stack = options.stackIndex.indexOf(index) > -1
              }
              if (options.stackLabel) {
                item.stack = options.stackLabel[index]

                // ----------- 堆叠数据添加总数显示 ---------------
                // 查找相同 stack label 的 series
                const sameStacks = data.series.filter(sameStack => sameStack.stack === item.stack)
                // 两个以上相同 stack 的 series，计算所有  series 的总和
                if (sameStacks.length > 1 && sameStacksLabel.indexOf(sameStacks[0].stack) === -1) {
                  const totalStack = JSON.parse(JSON.stringify(sameStacks[0]))
                  // 保存已经计算总数的 stack
                  sameStacksLabel.push(totalStack.stack)
                  // 获取总数的 stack
                  const totalStackData = [] // 相同 stack 的数据总和
                  totalStack.data.forEach((ts, tsIndex) => {
                    let total = 0
                    sameStacks.forEach(st => {
                      total = st.data[tsIndex] + total
                    })
                    totalStackData.push(total)
                  })
                  totalStack.data = totalStackData
                  const totalLabel = {
                    show: true, // 开启显示
                    position: 'top',
                    offset: options.stackTotalLabelPosion || [0, 0],
                    textStyle: {
                      color: echart.$fontColor || echart.fontColor, // 注意: mac 中无法获取 $变量, mac中直接通过变量名获取
                      fontSize: 16,
                    },
                    formatter: function (params) {
                      return (
                        '{total|' +
                        `${totalStackData[params.dataIndex].toFixed(1)}}` +
                        `\n ${params.value}`
                      )
                    },
                    rich: {
                      total: {
                        color: echart.$standardColor || echart.standardColor, // 注意: mac 中无法获取 $变量, mac中直接通过变量名获取
                        fontSize: 16,
                      },
                    },
                  }
                  // 查找总数 stack 的位置,并将 总数 series 插入
                  for (let i = data.series.length - 1; i >= 0; i--) {
                    if (data.series[i].stack === totalStack.stack) {
                      data.series[i].itemStyle.normal.label = totalLabel
                      break
                    }
                  }
                }
              }
            })

          return data.series || []
        }
      })(),
    }
  }
}

// 导出 barOptions 函数，用于生成 bar 图的配置项
export function barOptions(props) {
  const { data } = props

  const getDefaultOpt = new defaultOptTemp({ options: props.params, data }).option

  const opt = recursionObject({}, getDefaultOpt, props.options)
  //实例传入自定义 series 配置时，递归合并默认 series 配置和实例配置参数
  if (props.options.series) {
    opt.series = recursionObject([], getDefaultOpt.series, props.options.series)
  }
  if (props.params.dataset && data.length > 1) {
    // 纵向bar
    opt.dataset.source = data.reverse()
    opt.dataset.dimensions = Object.keys(data[0])
  }

  return opt
}
