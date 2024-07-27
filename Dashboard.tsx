import { Dimensions, StyleSheet, View } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import EventSource from "react-native-sse";
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TitleComponent } from 'echarts/components';
import { SVGRenderer, SvgChart } from '@wuba/react-native-echarts';

echarts.use([SVGRenderer, LineChart, GridComponent, TitleComponent]);
const E_HEIGHT = Dimensions.get('window').height;
const E_WIDTH = Dimensions.get('window').width;

export default function Dashboard() {
    const datapoints100t = [];
    const datapoints600t = [];
    const datapoints3000t = [];
    const timeLine: string[] = [];

    const skiaRef = useRef<any>();
    const [es, setEs] = useState<EventSource>();
    let i = 0;

    function toDateString(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    function openConnection() {
        const es = new EventSource("http://192.168.1.222:8080/api/serverMSPT")
        es.addEventListener("open", (event) => {
            console.log("SSE Channel opened");
        });
        es.addEventListener("message", (event) => {
            console.log("data:" + JSON.stringify(event));
            let mspt = event.data.split(",");
            let date = new Date();
            console.log(date.getDate());
            let datestring = toDateString(date);
            datapoints100t.push([datestring, parseFloat(mspt[0])]);
            datapoints600t.push([datestring, parseFloat(mspt[1])]);
            datapoints3000t.push([datestring, parseFloat(mspt[0])]);
            i++;
        });
        es.addEventListener("error", (event) => {
            console.log(JSON.stringify(event));
            es.removeAllEventListeners();
            es.close();
            openConnection();
        });
        setEs(es);
    }

    useEffect(() => {
        openConnection();
        return () => {
            es?.removeAllEventListeners();
            es?.close();
        }
    }, []);


    useEffect(() => {
        let time = new Date();
        let options = {
            title: {
                left: 'center',
                text: '服务器mspt'
            },
            xAxis: {
                type: 'time',
                name: '时间',
                min: toDateString(new Date()),
                max: toDateString(new Date(new Date().getTime() + 120000)),
                splitNumber: 3
            },
            yAxis: {
                type: 'value',
                name: 'mspt',
                min: 0,
                max: 100
            },
            series: [
                {
                    name: 'MSPT5s',
                    type: 'line',
                    smooth: 'true',
                    data: []
                },
                {
                    name: 'MSPT30s',
                    type: 'line',
                    smooth: 'true',
                    data: []
                },
                {
                    name: 'MSPT300s',
                    type: 'line',
                    smooth: 'true',
                    data: []
                }
            ]
        }
        let chart: echarts.ECharts;
        if (skiaRef != null) {
            chart = echarts.init(skiaRef.current, 'light', {
                renderer: 'svg',
                width: E_WIDTH * 0.8,
                height: E_HEIGHT * 0.75,
            });
            chart.setOption(options);
        }
        let inter = setInterval(() => {
            options.series[0].data = datapoints100t;
            options.series[1].data = datapoints600t;
            options.series[2].data = datapoints3000t;
            chart.setOption(options);
            console.log(JSON.stringify(options))
        }, 5000);
        return () => {
            chart?.dispose();
            clearInterval(inter);
        };
    }, []);
    return <SvgChart ref={skiaRef} />;
}