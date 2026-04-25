import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendUp, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 border-primary-200',
    solar: 'bg-gradient-to-br from-solar-50 to-solar-100 text-solar-600 border-solar-200',
    secondary: 'bg-gradient-to-br from-secondary-50 to-secondary-100 text-secondary-600 border-secondary-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200',
    red: 'bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200'
  };

  const iconBgClasses = {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600',
    solar: 'bg-gradient-to-br from-solar-500 to-solar-600',
    secondary: 'bg-gradient-to-br from-secondary-100 to-secondary-200 border border-secondary-200/50 shadow-sm',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    red: 'bg-gradient-to-br from-red-500 to-red-600',
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600'
  };

  return (
    <div className="card hover:shadow-xl hover:shadow-primary-500/20 transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-white to-gray-50/50 group backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-700 transition-colors animate-fade-in">{value}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1.5 mt-3 text-sm font-medium px-2 py-1 rounded-full ${
              trendUp
                ? 'text-green-700 bg-green-100'
                : 'text-red-700 bg-red-100'
            } animate-slide-in`}>
              {trendUp ? <ArrowUpRight className="w-4 h-4 animate-bounce-in" /> : <ArrowDownRight className="w-4 h-4 animate-bounce-in" />}
              <span>{trend}</span>
            </div>
          )}
          {/* Mini progress bar for conversion */}
          {title === 'Conversion Rate' && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-solar-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(parseFloat(value) * 2, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow ${iconBgClasses[color]} group-hover:scale-110 transition-all duration-300`}>
          <Icon 
            strokeWidth={1.5}
            className={`w-6 h-6 group-hover:animate-pulse transition-colors ${
              color === 'secondary' ? 'text-secondary-600' : 'text-white'
            }`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
