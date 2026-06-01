import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, isToday, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DateSelector = ({ selectedDate, onDateChange }: DateSelectorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dates] = useState(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      result.push(subDays(new Date(), i));
    }
    return result;
  });

  useEffect(() => {
    // 初始化时滚动到最右边（今天）
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const getDateLabel = (date: Date) => {
    return format(date, 'd', { locale: zhCN });
  };

  const getWeekDayLabel = (date: Date) => {
    if (isToday(date)) return '今天';
    if (isSameDay(date, subDays(new Date(), 1))) return '昨天';
    return format(date, 'EEE', { locale: zhCN });
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 w-full"
    >
      {dates.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const dateLabel = getDateLabel(date);
        const weekDay = getWeekDayLabel(date);

        return (
          <motion.button
            key={date.toISOString()}
            onClick={() => onDateChange(date)}
            className={`flex-1 flex flex-col items-center py-1 px-1 rounded-lg transition-all touch-feedback ${
              isSelected
                ? 'bg-blue-50 border border-[#1456F0]'
                : 'border border-transparent'
            }`}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <span className={`text-sm ${isSelected ? 'font-bold text-[#1456F0]' : 'font-normal text-slate-400'}`}>
              {dateLabel}
            </span>
            <span className={`text-[10px] ${isSelected ? 'text-[#1456F0] font-medium' : 'text-slate-400'}`}>
              {weekDay}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default DateSelector;
