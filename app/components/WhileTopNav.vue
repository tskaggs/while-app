<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'

const config = useRuntimeConfig()
const { data: session } = await authClient.useSession(useFetch)

const showNav = computed(() => config.public.mockMode || Boolean(session.value))

const navItems: NavigationMenuItem[] = [{
  label: 'Overview',
  to: '/'
}, {
  label: 'Connections',
  to: '/connections'
}, {
  label: 'Messages',
  to: '/messages'
}, {
  label: 'Tunnel Uptime',
  to: '/uptime'
}, {
  label: 'Logs',
  to: '/logs'
}, {
  label: 'Compliance',
  to: '/compliance'
}, {
  label: 'Developer Docs',
  to: '/docs'
}, {
  label: 'Support',
  to: '/support'
}]
</script>

<template>
  <header v-if="showNav" class="sticky top-0 z-50 border-b border-default bg-default/80 backdrop-blur-md">
    <div class="flex h-14 items-center gap-4 px-4 lg:px-6">
      <WhileLogo />

      <nav class="hidden min-w-0 flex-1 lg:flex lg:justify-center">
        <UNavigationMenu
          :items="navItems"
          orientation="horizontal"
          variant="link"
          color="neutral"
          class="while-top-nav-pills"
          :ui="{
            list: 'gap-0.5',
            link: 'while-top-nav-link flex-col items-stretch px-3 py-1.5 text-sm font-medium',
            linkLeadingIcon: 'hidden'
          }"
        />
      </nav>

      <div class="ml-auto flex items-center gap-2 shrink-0">
        <UDashboardSearchButton class="hidden sm:flex" />
        <EnvironmentSwitcher />
        <TunnelUptimeIndicator />
        <UButton
          icon="i-iconoir-bell"
          color="neutral"
          variant="ghost"
          size="sm"
          square
          aria-label="Notifications"
          class="relative"
        >
          <span class="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-error" />
        </UButton>
        <UserMenu collapsed />
      </div>
    </div>

    <nav class="flex overflow-x-auto border-t border-default px-4 pb-2 pt-2 lg:hidden">
      <UNavigationMenu
        :items="navItems"
        orientation="horizontal"
        variant="link"
        color="neutral"
        class="while-top-nav-pills min-w-max"
        :ui="{
          list: 'gap-0.5',
          link: 'while-top-nav-link flex-col items-stretch px-3 py-1.5 text-xs font-medium whitespace-nowrap',
          linkLeadingIcon: 'hidden'
        }"
      />
    </nav>
  </header>
</template>
