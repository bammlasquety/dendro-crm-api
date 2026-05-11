
<template>
  <q-item
    clickable
    v-ripple
    :to="!external ? link : undefined"
    :href="external ? link : undefined"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    active-class="bg-grey-3 text-primary"
  >
    <q-item-section avatar v-if="icon">
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption v-if="caption">
        {{ caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">


export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link: string;
  icon?: string;
  external?: boolean
};

withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
});
</script>
