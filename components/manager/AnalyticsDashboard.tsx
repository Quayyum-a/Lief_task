'use client'

import React from 'react'
import { Card, Row, Col, Statistic, Typography } from 'antd'
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  PointElement,
  ArcElement,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { useShift } from '@/context/ShiftContext'

const { Title } = Typography

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
)

export default function AnalyticsDashboard() {
  const { dashboardStats, allStaff } = useShift()

  // Mock data for charts
  const weeklyHoursData = {
    labels: dashboardStats.weeklyHoursByStaff.map(staff => staff.name.split(' ')[0]),
    datasets: [
      {
        label: 'Hours This Week',
        data: dashboardStats.weeklyHoursByStaff.map(staff => staff.totalHours),
        backgroundColor: 'rgba(24, 144, 255, 0.6)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 1,
      },
    ],
  }

  // Mock daily attendance data
  const dailyAttendanceData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Clock-ins',
        data: [12, 15, 11, 18, 14, 8, 5],
        borderColor: 'rgba(82, 196, 26, 1)',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Average Hours',
        data: [8.2, 8.5, 7.8, 9.1, 8.0, 6.5, 4.2],
        borderColor: 'rgba(255, 77, 79, 1)',
        backgroundColor: 'rgba(255, 77, 79, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  }

  // Staff distribution data
  const staffDistributionData = {
    labels: ['Currently Working', 'On Break', 'Off Duty'],
    datasets: [
      {
        data: [
          allStaff.filter(s => s.isOnline && s.currentShift).length,
          allStaff.filter(s => s.isOnline && !s.currentShift).length,
          allStaff.filter(s => !s.isOnline).length,
        ],
        backgroundColor: [
          'rgba(82, 196, 26, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(108, 117, 125, 0.8)',
        ],
        borderColor: [
          'rgba(82, 196, 26, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(108, 117, 125, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Clock-ins',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Hours',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Hours/Day"
              value={dashboardStats.averageHoursPerDay}
              precision={1}
              suffix="hrs"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Clock-ins"
              value={dashboardStats.dailyClockIns}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Staff"
              value={dashboardStats.totalActiveStaff}
              suffix={`/ ${allStaff.length}`}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Efficiency Rate"
              value={87.5}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Weekly Hours by Staff">
            <div style={{ height: '300px' }}>
              <Bar data={weeklyHoursData} options={chartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Staff Status Distribution">
            <div style={{ height: '300px' }}>
              <Doughnut data={staffDistributionData} options={doughnutOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Daily Attendance Trends">
            <div style={{ height: '400px' }}>
              <Line data={dailyAttendanceData} options={lineChartOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Additional Insights */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Peak Hours">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Morning Shift (6AM - 2PM)</span>
                <span className="font-semibold text-green-600">75% Attendance</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Afternoon Shift (2PM - 10PM)</span>
                <span className="font-semibold text-blue-600">82% Attendance</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Night Shift (10PM - 6AM)</span>
                <span className="font-semibold text-orange-600">68% Attendance</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Weekly Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Hours Logged</span>
                <span className="font-semibold">1,247 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Average Shift Length</span>
                <span className="font-semibold">8.3 hrs</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Late Clock-ins</span>
                <span className="font-semibold text-red-600">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Early Clock-outs</span>
                <span className="font-semibold text-orange-600">1</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
