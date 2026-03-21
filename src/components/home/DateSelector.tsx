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
    for (let i = 0; i < 14; i++) {
      result.push(subDays(new Date(), i));
    }
    return result;
  });

  useEffect(() => {
    // 初始化时滚动到选中日期
    if (scrollRef.current) {
      const selectedIndex = dates.findIndex(d => isSameDay(d, selectedDate));
      const scrollPosition = selectedIndex * 64 - 16;
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
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
      className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2"
    >
      {dates.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const dateLabel = getDateLabel(date);
        const weekDay = getWeekDayLabel(date);

        return (
          <motion.button
            key={date.toISOString()}
            onClick={() => onDateChange(date)}
            className={`relative flex flex-col items-center min-w-[56px] py-2 px-3 rounded-xl transition-colors touch-feedback ${
              isSelected 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <span className={`text-xs ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}>
              {weekDay}
            </span>
            <span className="text-lg font-semibold">
              {dateLabel}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default DateSelector;
