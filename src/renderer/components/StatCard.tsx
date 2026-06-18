import { Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = '#165DFF'
}: StatCardProps) {
  return (
    <Card className="shadow-card hover:shadow-hover transition-shadow duration-300 border-0 rounded-xl overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-800 font-mono">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <ArrowUpOutlined className="text-success" />
              ) : (
                <ArrowDownOutlined className="text-danger" />
              )}
              <span
                className={`text-sm ${trend >= 0 ? 'text-success' : 'text-danger'}`}
              >
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-400 ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
