import { StatusBar } from 'expo-status-bar';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { AreaChart, Grid } from 'react-native-svg-charts';
import EventSource from "react-native-sse";
import * as shape from 'd3-shape'
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TitleComponent } from 'echarts/components';
import { SVGRenderer, SkiaChart, SvgChart } from '@wuba/react-native-echarts';
import { dataTool } from 'echarts';

echarts.use([SVGRenderer, LineChart, GridComponent,TitleComponent]);
const E_HEIGHT = Dimensions.get('window').height;
const E_WIDTH = Dimensions.get('window').width;


export default function Lapotron() {
  const datapoints: number[][] = [];
  const skiaRef = useRef<any>();
  let i = 0;
  
  useEffect(() => {
    const es = new EventSource("http://192.168.1.222:8080/SSE-Example")
    es.addEventListener("open", (event) => {
      console.log("SSE Channel opened");
    });
    es.addEventListener("message", (event) => {
      let ns = event.data.split(",");
      datapoints.push([parseInt(ns[0]), parseInt(ns[1])])
      i++;
    });
    es.addEventListener("error", (event) => {
      console.log(JSON.stringify(event));
    });
    es.addEventListener("close", () => {
      console.log("Close SSE Connection");
    });
  }, []);
  
  useEffect(() => {
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
          data: []
        }
      ]
    }
    let chart: echarts.ECharts;
    if (skiaRef != null) {
      chart = echarts.init(skiaRef.current, 'light', {
        renderer: 'svg',
        width: 400,
        height: 400,
      });
      chart.setOption(options);
    }
    let inter = setInterval(() => {
      options.series[0].data = datapoints;
      console.log(options.series[0].data);
      chart.setOption(options);
    }, 1000);
    return () => {
      chart?.dispose();
      clearInterval(inter);
    };
  }, []);
  return <View style={styles.container}><SvgChart ref={skiaRef} /></View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
