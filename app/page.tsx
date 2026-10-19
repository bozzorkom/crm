import { currentUser } from '@/lib/data'
import { Composer } from '@/components/today/composer'
import { AttentionList } from '@/components/today/attention-list'
import { TodayGreeting } from '@/components/today/today-greeting'
import { ShowingsToday } from '@/components/today/today-sections'

export default function TodayPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 md:px-8 md:py-16">
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
        <TodayGreeting firstName={currentUser.firstName} />
        <Composer />
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <AttentionList />
        <ShowingsToday />
      </div>
    </div>
  )
}
