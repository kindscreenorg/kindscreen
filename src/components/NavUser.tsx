import SignOutButton from './SignOutButton'

interface Props { username: string; greeting: string; signOutLabel: string }

export default function NavUser({ username, greeting, signOutLabel }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:block text-sm font-semibold text-warm-700 max-w-[160px] truncate">
        {greeting}
      </span>
      <span className="block sm:hidden text-sm font-semibold text-warm-700 max-w-[100px] truncate">
        {username}
      </span>
      <SignOutButton label={signOutLabel} className="btn-secondary text-sm py-2 px-4" />
    </div>
  )
}
