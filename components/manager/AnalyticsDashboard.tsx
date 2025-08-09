'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  DatePicker, 
  Table,
  Progress,
  Tag,
  Space,
  Button,
  Alert
} from 'antd'
import { 
  ClockCircleOutlined, 
  UserOutlined, 
  RiseOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Line, Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { useShift } from '@/context/ShiftContext'
import dayjs, { Dayjs } from 'dayjs'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
)

const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface AnalyticsData {
  totalHours: number
  totalShifts: number
  averageShiftLength: number
  totalStaff: number
  activeStaff: number
  dailyHours: { date: string; hours: number }[]
  staffPerformance: { name: string; hours: number; shifts: number }[]
  shiftPatterns: { hour: number; count: number }[]
  weeklyTrends: { week: string; hours: number; shifts: number }[]
  departmentBreakdown: { department: string; hours: number; percentage: number }[]
}

export default function AnalyticsDashboard() {
  const { allStaff, refreshData } = useShift()
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  // Generate mock analytics data
  useEffect(() => {
    const generateAnalyticsData = (): AnalyticsData => {
      const days = timeRange[1].diff(timeRange[0], 'days')
      
      // Generate daily hours data
      const dailyHours = Array.from({ length: days }, (_, i) => {
        const date = timeRange[0].add(i, 'days')
        return {
          date: date.format('MM/DD'),
          hours: Math.random() * 100 + 150 // 150-250 hours per day
        }
      })

      // Generate staff performance data
      const staffPerformance = allStaff.slice(0, 10).map(staff => ({
        name: staff.name,
        hours: Math.random() * 40 + 20,
        shifts: Math.floor(Math.random() * 10) + 5
      }))

      // Generate shift patterns (hours of day when people clock in)
      const shiftPatterns = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hour >= 6 && hour <= 10 ? Math.random() * 20 + 10 : // Morning rush
               hour >= 14 && hour <= 18 ? Math.random() * 15 + 8 : // Afternoon
               hour >= 22 || hour <= 2 ? Math.random() * 10 + 5 : // Night shift
               Math.random() * 5
      }))

      // Generate weekly trends
      const weeklyTrends = Array.from({ length: 8 }, (_, i) => {
        const week = dayjs().subtract(i, 'weeks')
        return {
          week: week.format('MM/DD'),
          hours: Math.random() * 500 + 800,
          shifts: Math.floor(Math.random() * 50) + 100
        }
      }).reverse()

      // Generate department breakdown
      const departments = ['Emergency', 'ICU', 'Surgery', 'Pediatrics', 'Cardiology']
      const departmentBreakdown = departments.map(dept => {
        const hours = Math.random() * 200 + 100
        return {
          department: dept,
          hours,
          percentage: 0 // Will calculate below
        }
      })
      
      const totalDeptHours = departmentBreakdown.reduce((sum, dept) => sum + dept.hours, 0)
      departmentBreakdown.forEach(dept => {
        dept.percentage = (dept.hours / totalDeptHours) * 100
      })

      return {
        totalHours: dailyHours.reduce((sum, day) => sum + day.hours, 0),
        totalShifts: Math.floor(Math.random() * 200) + 300,
        averageShiftLength: Math.random() * 3 + 7, // 7-10 hours
        totalStaff: allStaff.length,
        activeStaff: Math.floor(allStaff.length * 0.8),
        dailyHours,
        staffPerformance,
        shiftPatterns,
        weeklyTrends,
        departmentBreakdown
      }
    }

    setAnalyticsData(generateAnalyticsData())
  }, [timeRange, allStaff])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refreshData()
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // In a real app, this would generate and download a report
    console.log('Exporting analytics data...')
  }

  if (!analyticsData) {
    return <div>Loading analytics...</div>
  }

  // Chart configurations
  const dailyHoursChart = {
    labels: analyticsData.dailyHours.map(d => d.date),
    datasets: [
      {
        label: 'Daily Hours',
        data: analyticsData.dailyHours.map(d => d.hours),
        borderColor: 'rgb(24, 144, 255)',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const shiftPatternsChart = {
    labels: analyticsData.shiftPatterns.map(p => `${p.hour}:00`),
    datasets: [
      {
        label: 'Clock-ins by Hour',
        data: analyticsData.shiftPatterns.map(p => p.count),
        backgroundColor: 'rgba(82, 196, 26, 0.8)',
        borderColor: 'rgb(82, 196, 26)',
        borderWidth: 1,
      },
    ],
  }

  const departmentChart = {
    labels: analyticsData.departmentBreakdown.map(d => d.department),
    datasets: [
      {
        data: analyticsData.departmentBreakdown.map(d => d.hours),
        backgroundColor: [
          '#ff6384',
          '#36a2eb',
          '#ffce56',
          '#4bc0c0',
          '#9966ff',
        ],
      },
    ],
  }

  const staffColumns = [
    {
      title: 'Staff Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Total Hours',
      dataIndex: 'hours',
      key: 'hours',
      render: (hours: number) => `${hours.toFixed(1)}h`,
      sorter: (a: { hours: number }, b: { hours: number }) => a.hours - b.hours,
    },
    {
      title: 'Shifts',
      dataIndex: 'shifts',
      key: 'shifts',
      sorter: (a: { shifts: number }, b: { shifts: number }) => a.shifts - b.shifts,
    },
    {
      title: 'Avg per Shift',
      key: 'average',
      render: (record: { hours: number; shifts: number }) => `${(record.hours / record.shifts).toFixed(1)}h`,
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (record: { hours: number }) => {
        const percentage = Math.min((record.hours / 40) * 100, 100)
        return (
          <Progress 
            percent={percentage} 
            size="small" 
            status={percentage > 80 ? 'success' : percentage > 60 ? 'normal' : 'exception'}
            showInfo={false}
          />
        )
      },
    },
  ]

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

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Analytics Dashboard</Title>
        <Space>
          <RangePicker
            value={timeRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setTimeRange([dates[0], dates[1]])
              }
            }}
            format="MM/DD/YYYY"
          />
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            type="primary"
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            Export Report
          </Button>
        </Space>
      </div>

      {/* Key Metrics */}
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Hours"
              value={analyticsData.totalHours}
              precision={0}
              suffix="h"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-xs">
                Past {timeRange[1].diff(timeRange[0], 'days')} days
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Shifts"
              value={analyticsData.totalShifts}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2">
              <Tag color="green" icon={<RiseOutlined />}>
                +12% from last period
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Avg Shift Length"
              value={analyticsData.averageShiftLength}
              precision={1}
              suffix="h"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-xs">
                Target: 8.0h
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Staff"
              value={analyticsData.activeStaff}
              suffix={`/ ${analyticsData.totalStaff}`}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="mt-2">
              <Progress 
                percent={(analyticsData.activeStaff / analyticsData.totalStaff) * 100} 
                size="small" 
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Daily Hours Trend" extra={<ClockCircleOutlined />}>
            <div style={{ height: '300px' }}>
              <Line data={dailyHoursChart} options={chartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Department Breakdown">
            <div style={{ height: '300px' }}>
              <Pie 
                data={departmentChart} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }} 
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Clock-in Patterns by Hour">
            <div style={{ height: '300px' }}>
              <Bar data={shiftPatternsChart} options={chartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Weekly Trends">
            <div style={{ height: '300px' }}>
              <Line 
                data={{
                  labels: analyticsData.weeklyTrends.map(w => w.week),
                  datasets: [
                    {
                      label: 'Hours',
                      data: analyticsData.weeklyTrends.map(w => w.hours),
                      borderColor: 'rgb(24, 144, 255)',
                      backgroundColor: 'rgba(24, 144, 255, 0.1)',
                      yAxisID: 'y',
                    },
                    {
                      label: 'Shifts',
                      data: analyticsData.weeklyTrends.map(w => w.shifts),
                      borderColor: 'rgb(82, 196, 26)',
                      backgroundColor: 'rgba(82, 196, 26, 0.1)',
                      yAxisID: 'y1',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                  scales: {
                    y: {
                      type: 'linear' as const,
                      display: true,
                      position: 'left' as const,
                    },
                    y1: {
                      type: 'linear' as const,
                      display: true,
                      position: 'right' as const,
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Staff Performance Table */}
      <Card title="Top Performers">
        <Table
          columns={staffColumns}
          dataSource={analyticsData.staffPerformance}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Insights */}
      <Card title="Key Insights">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Alert
              message="Peak Hours"
              description="Most clock-ins occur between 7-9 AM and 2-4 PM. Consider scheduling more managers during these times."
              type="info"
              showIcon
              className="mb-4"
            />
          </Col>
          <Col xs={24} md={12}>
            <Alert
              message="Department Efficiency"
              description="Emergency department shows highest hours per staff ratio. Consider workload balancing."
              type="warning"
              showIcon
              className="mb-4"
            />
          </Col>
        </Row>
      </Card>
    </div>
  )
}
