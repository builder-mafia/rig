import { motion } from 'motion/react';

export const LeftPanel = () => {
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: 360 }}
      exit={{ width: 0 }}
      transition={{ ease: 'easeInOut', duration: 0.12 }}
      className='h-full overflow-hidden shadow-md rounded-2xl bg-accent'
    />
  );
};
