import { AnimatedBarChart } from './AnimatedBarChart';

interface InputCategoryData {
  category: string;
  count: number;
}

interface OutputCategoryData {
  category: string;
  percentage: number;
  count: number;
}

interface NetworkGraphProps {
  data: InputCategoryData[];
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  // Calculate percentages from counts
  const totalCount = data.reduce((sum, item) => sum + (item.count || 0), 0);

  const dataWithPercentages: OutputCategoryData[] = data.map(item => ({
    category: item.category,
    count: item.count || 0,
    percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0
  }));

  return (
    <div className="w-full">
      <AnimatedBarChart data={dataWithPercentages} />
    </div>
  );
}
