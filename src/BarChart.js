import { Bar, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
    extends: Bar,
    mixins: [reactiveProp],
    data: function () {
      return {
          options: {
              legend: { display: true },
              title: {
                display: true
                // text: 'Total Monthly Spendings on Bookings'
              },
              responsive: true,
              maintainAspectRatio: false
          }
      }
    },
    mounted () {
      this.renderChart(this.chartData, this.options)
    }
}