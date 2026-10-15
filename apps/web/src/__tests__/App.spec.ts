import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it.skip('mounts renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('You did it!')
  })
})
