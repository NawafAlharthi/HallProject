import * as React from "react"

const Select = React.forwardRef(({ children, ...props }, ref) => (
  <select ref={ref} {...props}>
    {children}
  </select>
))
Select.displayName = "Select"

export { Select } 