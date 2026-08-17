interface LogoProps {
  className?: string
}

// Swaps between the dark-background and light-background logo variants
// purely via CSS ([data-theme='light'] toggles which is visible), so it
// works correctly wherever it's rendered without needing the theme passed
// down as a prop — including modals mounted deep in the component tree.
export function Logo({ className = 'h-8' }: LogoProps) {
  return (
    <>
      <img src="/logo-dark.svg" alt="justapply" className={`${className} logo-for-dark`} />
      <img src="/logo-light.svg" alt="justapply" className={`${className} logo-for-light`} />
    </>
  )
}
