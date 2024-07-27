"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_native_1 = require("react-native");
var react_1 = require("react");
var react_native_charts_wrapper_1 = require("react-native-charts-wrapper");
var E_HEIGHT = react_native_1.Dimensions.get('window').height;
var E_WIDTH = react_native_1.Dimensions.get('window').width;
function App() {
    var _a = (0, react_1.useState)(), datapoints = _a[0], setDatapoints = _a[1];
    var _b = (0, react_1.useState)(0), notifier = _b[0], setNotifier = _b[1];
    var skiaRef = (0, react_1.useRef)();
    var i = 0;
    /*
    useEffect(() => {
      const es = new EventSource("http://192.168.1.222:8080/SSE-Example")
      es.addEventListener("open", (event) => {
        console.log("SSE Channel opened");
      });
      es.addEventListener("message", (event) => {
        console.log("data:" + JSON.stringify(event));
        let ns = event.data.split(",");
        setDatapoints(arr => [...arr, [parseInt(ns[0]), parseInt(ns[1])]]);
        setNotifier(i);
        i++;
      });
      es.addEventListener("error", (event) => {
        console.log(JSON.stringify(event));
      });
      es.addEventListener("close", () => {
        console.log("Close SSE Connection");
      });
    }, []);
    */
    (0, react_1.useEffect)(function () {
        /*
        let options = {
          title: {
            left: 'center',
            text: '兰波顿超级电容库'
          },
          xAxis: {
            type: 'value',
            data: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            name: '时间',
            axisLabel: {
              formatter: '{value} tick'
            }
          },
          yAxis: {
            type: 'value',
            data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            name: '电量',
            axisLabel: {
              formatter: '{value} EU/t'
            }
          },
          series: [
            {
              name: 'Test data',
              type: 'line',
              smooth: 'true',
              data: [[1, 1], [2, 2], [3, 3], [4, 2], [5, 1]]
            }
          ]
        }
        */
        var options = {
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
            yAxis: {
                type: 'value',
            },
            series: [
                {
                    data: [150, 230, 224, 218, 135, 147, 260],
                    type: 'line',
                },
            ],
        };
        setDatapoints(options);
    }, []);
    return (<react_native_1.View style={{ flex: 1 }}>
        <react_native_1.View style={styles.container}>
          <react_native_charts_wrapper_1.LineChart style={{ flex: 1, backgroundColor: '#00FF00' }} data={{ dataSets: [{ label: "demo", values: [{ y: 1 }, { y: 2 }, { y: 1 }] }] }}/>
        </react_native_1.View>
      </react_native_1.View>);
}
exports.default = App;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF0000',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
