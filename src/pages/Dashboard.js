import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const stats = [
  {
    name: 'Total Students',
    value: '2,345',
    icon: UserGroupIcon,
    change: '+4.75%',
    changeType: 'positive',
  },
  {
    name: 'Active Classes',
    value: '48',
    icon: BookOpenIcon,
    change: '+2.1%',
    changeType: 'positive',
  },
  {
    name: 'Attendance Rate',
    value: '94.2%',
    icon: CalendarIcon,
    change: '-0.4%',
    changeType: 'negative',
  },
  {
    name: 'Average Grade',
    value: 'B+',
    icon: ChartBarIcon,
    change: '+0.3%',
    changeType: 'positive',
  },
];

const Dashboard = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Here's what's happening with your school today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-100 text-primary-500">
                  <stat.icon className="h-6 w-6" />
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p
                    className={`ml-2 text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-display font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0">
                <span className="inline-block h-8 w-8 rounded-full bg-primary-100" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">
                  New assignment submitted
                </p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 