export const coverFallback = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop';

export const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: easeOut }
  })
};

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
};
