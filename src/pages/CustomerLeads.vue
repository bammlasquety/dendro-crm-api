<template>
  <q-page class="q-pa-lg">
    <ContactsList
      :contacts="contacts"
      :loading="loading"
      :refreshable="true"
      :refreshing="refreshing"
      :importable="true"
      @add="onAddContact"
      @select="onSelectContact"
      @delete="onDeleteContact"
      @refresh="loadContacts"
      @import="onImportContacts"
      @update-status="onUpdateStatus"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import ContactsList from '../components/ContactsList.vue';
import type { ContactRow } from '../components/ContactsList.vue';

const API = '/api/customer-leads';

const $q = useQuasar();
const contacts = ref<ContactRow[]>([]);
const loading = ref(false);
const refreshing = ref(false);

// ─── Mapper ───────────────────────────────────────────────────────────────────
// 1. Narrow every field with typeof === 'string' before use — satisfies
//    @typescript-eslint/no-base-to-string (Record<string,unknown> values are
//    not guaranteed strings so String() on them triggers the rule).
// 2. Spread optional fields so undefined is never explicitly assigned —
//    required by exactOptionalPropertyTypes: true.

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function toContactRow(row: Record<string, unknown>): ContactRow {
  // Narrow all fields up-front — plain string or undefined
  const id = str(row['id']) ?? '';
  const name = str(row['name']) ?? '';
  const email = str(row['email']) ?? '';
  const status = str(row['status']);
  const leadStatus = str(row['lead_status']);
  const contactNumber = str(row['contact_number']);
  const jobTitle = str(row['job_title']);
  const farmLocation = str(row['farm_location']);
  const region = str(row['region']);
  const companyName = str(row['company_name']);
  const label = str(row['label']);

  return {
    // Required
    id,
    name,
    email,
    status: (status as 'active' | 'inactive') ?? 'active',
    leadStatus: (leadStatus as ContactRow['leadStatus']) ?? 'new',
    webinarOptIn: Boolean(row['optin_webinar']),
    webinarAttended: Boolean(row['webinar_attended']),
    newsletterOptIn: Boolean(row['optin_newsletter']),

    // Optional — omit key entirely when falsy (exactOptionalPropertyTypes)
    ...(contactNumber ? { contactNumber } : {}),
    ...(jobTitle ? { jobTitle } : {}),
    ...(farmLocation ? { farmLocation } : {}),
    ...(region ? { region } : {}),
    ...(companyName ? { companyName } : {}),
    ...(label ? { label } : {}),
  };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function loadContacts() {
  loading.value = true;
  refreshing.value = true;
  try {
    const { data } = await axios.get<{ leads: Record<string, unknown>[] }>(API);
    contacts.value = (data.leads ?? []).map(toContactRow);
  } catch (err) {
    console.error('[CustomerLeads] loadContacts failed:', err);
    $q.notify({ type: 'negative', message: 'Failed to load contacts.' });
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function onAddContact() {
  $q.notify({ type: 'info', message: 'Add Contact — hook dialog here.' });
}

function onSelectContact(row: ContactRow) {
  $q.notify({ type: 'info', message: `Selected: ${row.name}` });
}

function onImportContacts() {
  $q.notify({ type: 'info', message: 'Import Contacts — hook CSV upload here.' });
}

async function onDeleteContact(id: string) {
  try {
    await axios.delete(`${API}/${id}`);
    contacts.value = contacts.value.filter((c) => c.id !== id);
    $q.notify({ type: 'positive', message: 'Contact deleted.' });
  } catch (err) {
    console.error('[CustomerLeads] onDeleteContact failed:', err);
    $q.notify({ type: 'negative', message: 'Failed to delete contact.' });
  }
}

async function onUpdateStatus(payload: { id: string; status: 'active' | 'inactive' }) {
  try {
    await axios.patch(`${API}/${payload.id}`, { status: payload.status });

    const idx = contacts.value.findIndex((c) => c.id === payload.id);
    if (idx !== -1) {
      contacts.value[idx] = { ...contacts.value[idx]!, status: payload.status };
    }

    $q.notify({ type: 'positive', message: 'Status updated.' });
  } catch (err) {
    console.error('[CustomerLeads] onUpdateStatus failed:', err);
    $q.notify({ type: 'negative', message: 'Failed to update status.' });
  }
}

onMounted(loadContacts);
</script>
