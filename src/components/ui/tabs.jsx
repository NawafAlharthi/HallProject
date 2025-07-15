import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef(({ className, value, onChange, children, ...props }, ref) => {
  // Find all TabsTrigger children and clone them with active state and onClick
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type && child.type.displayName === "TabsList") {
      // Enhance TabsList children
      return React.cloneElement(child, { value, onChange })
    }
    // Pass activeValue to TabsContent
    if (React.isValidElement(child) && child.type && child.type.displayName === "TabsContent") {
      return React.cloneElement(child, { activeValue: value })
    }
    return child
  })
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      {enhancedChildren}
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef(({ className, value, onChange, children, ...props }, ref) => {
  // Enhance TabsTrigger children
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child) && child.type && child.type.displayName === "TabsTrigger") {
      return React.cloneElement(child, {
        isActive: child.props.value === value,
        onClick: () => onChange && onChange(child.props.value)
      })
    }
    return child
  })
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {enhancedChildren}
    </div>
  )
})
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, isActive, value, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      isActive ? "bg-background text-foreground shadow-sm" : "",
      className
    )}
    aria-selected={isActive}
    {...props}
  >
    {children}
  </button>
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value, activeValue, children, ...props }, ref) => {
  if (value !== activeValue) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent } 