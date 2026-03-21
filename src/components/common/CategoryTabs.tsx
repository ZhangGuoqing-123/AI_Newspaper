import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2">
      {categories.map((category) => {
        const isActive = category === activeCategory;
        
        return (
          <motion.button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-feedback ${
              isActive 
                ? 'text-primary-foreground' 
                : 'text-muted-foreground bg-secondary hover:bg-secondary/80'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeCategoryBg"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{category}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
