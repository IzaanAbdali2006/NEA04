import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const chartData = {
  labels: ['Red', 'Blue', 'Yellow', 'Green'],
  datasets: [
    {
      label: 'My Doughnut Chart',
      data: [12, 19, 3, 5],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
      ],
      borderWidth: 1,
    },
  ],
};

const DoughnutChart = () => {
  return (
    <div>
      <h2>Doughnut Chart</h2>
      <div style={{ height: '400px', width: '400px' }}>
        <Doughnut data={chartData} />
      </div>
    </div>
  );
};

export default DoughnutChart;