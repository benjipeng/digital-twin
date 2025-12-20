import React from 'react'
import { vi } from 'vitest'

type MotionProps = React.HTMLAttributes<HTMLElement> & Record<string, unknown>

type ForwardedComponent = React.ForwardRefExoticComponent<
  MotionProps & React.RefAttributes<HTMLElement>
>

const createPassthrough = (tag: string): ForwardedComponent =>
  React.forwardRef(({ children, ...rest }: MotionProps, ref) => {
    const {
      layoutId,
      whileHover,
      whileTap,
      whileInView,
      onHoverStart,
      onHoverEnd,
      ...domProps
    } = rest
    void layoutId
    void whileHover
    void whileTap
    void whileInView
    void onHoverStart
    void onHoverEnd
    return React.createElement(tag, { ...domProps, ref }, children)
  })

vi.mock('framer-motion', async () => {
  const motion = new Proxy({}, {
    get: (_target, tag) => createPassthrough(tag as string)
  })

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>
  }
})
