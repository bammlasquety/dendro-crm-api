<template>
  <q-page class="column no-wrap" style="height: 100vh; overflow: hidden">
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

    <!-- Add dialog -->
    <AddLeadDialog
      v-model="showAddDialog"
      @created="onLeadCreated"
    />

    <!-- Edit dialog -->
    <ContactEditDialog
      v-model="showEditDialog"
      :contact="editTarget"
      @saved="onContactSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import ContactsList from '../components/ContactsList.vue';
import AddLeadDialog from '../components/AddLeadDialog.vue';
import ContactEditDialog from '../components/ContactEditDialog.vue';
import type { ContactRow } from '../types/contacts';

const API = '/api/customer-leads';

const $q = useQuasar();
const contacts = ref<ContactRow[]>([]);
const loading = ref(false);
const refreshing = ref(false);

// ─── Dialog state ─────────────────────────────────────────────────────────────

const showAddDialog  = ref(false);
const showEditDialog = ref(false);
const editTarget     = ref<ContactRow | null>(null);

// ─── Mapper ───────────────────────────────────────────────────────────────────

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function toContactRow(row: Record<string, unknown>): ContactRow {
  const contact: ContactRow = {
    id:              str(row['id'])          ?? '',
    name:            str(row['name'])        ?? '',
    email:           str(row['email'])       ?? '',
    status:          (str(row['status'])      as 'active' | 'inactive')    ?? 'active',
    leadStatus:      (str(row['lead_status']) as ContactRow['leadStatus']) ?? 'new',
    webinarOptIn:    Boolean(row['optin_webinar']),
    webinarAttended: Boolean(row['webinar_attended']),
    newsletterOptIn: Boolean(row['optin_newsletter']),
    createdAt:       str(row['created_at']) ?? '',
  };
  const cn = str(row['contact_number']); if (cn) contact.contactNumber = cn;
  const jt = str(row['job_title']);      if (jt) contact.jobTitle      = jt;
  const fl = str(row['farm_location']);  if (fl) contact.farmLocation  = fl;
  const rg = str(row['region']);         if (rg) contact.region        = rg;
  const co = str(row['company_name']);   if (co) contact.companyName   = co;
  const lb = str(row['label']);          if (lb) contact.label         = lb;
  return contact;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

interface ApiResponse {
  leads: Record<string, unknown>[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const PAGE_SIZE = 1000;

async function loadContacts() {
  loading.value    = true;
  refreshing.value = true;
  try {
    const first = await axios.get<ApiResponse>(API, { params: { page: 1, limit: PAGE_SIZE } });
    const { totalPages } = first.data.pagination;
    let allRows = first.data.leads ?? [];
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          axios.get<ApiResponse>(API, { params: { page: i + 2, limit: PAGE_SIZE } })
            .then(r => r.data.leads ?? [])
        )
      );
      allRows = allRows.concat(...rest);
    }
    contacts.value = allRows.map(toContactRow);
  } catch (err) {
    console.error('[CustomerLeads] loadContacts failed:', err);
    $q.notify({ type: 'negative', message: 'Failed to load contacts.' });
  } finally {
    loading.value    = false;
    refreshing.value = false;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function onAddContact() {
  showAddDialog.value = true;
}

function onLeadCreated(lead: ContactRow) {
  contacts.value = [lead, ...contacts.value];
  $q.notify({ type: 'positive', icon: 'person_add', message: `${lead.name} added successfully.`, timeout: 3000 });
}

function onSelectContact(row: ContactRow) {
  editTarget.value     = row;
  showEditDialog.value = true;
}

function onImportContacts() {
  $q.notify({ type: 'info', message: 'Import Contacts — coming soon.' });
}

<<<<<<< HEAD
async
=======
async function onDeleteContact(id: string) {
  try {
    await axios.delete(`${API}/${id}`);
    contacts.value = contacts.value.filter(c => c.id !== id);
    $q.notify({ type: 'positive', message: 'Contact deleted.' });
  } catch (err) {
    console.error('[CustomerLeads] onDeleteContact failed:', err);
    $q.notify({ type: 'negative', message: 'Failed to delete contact.' });
  }
}

async function onUpdateStatus(payload: { id: string; status: 'active' | 'inactive' }) {
  try {
    await axios.patch(`${API}/${payload.id}`, { status: payload.status });
    const idx = contacts.value.findIndex(c => c.id === payload.id);
    if (idx !== -1) contacts.value[idx] = { ...contacts.value[idx]!, status: payload.status };
    $q.notify({ type: 'positive', message: 'Status updated.' });
  } catch (err) {
    console.error('[CustomerLeads] onUpdateStatus failed:', err);
    $q.notify({ type: 'negative', message: 'Failed to update status.' });
  }
}

function onContactSaved(updated: ContactRow) {
  const idx = contacts.value.findIndex(c => c.id === updated.id);
  if (idx !== -1) contacts.value[idx] = updated;
  $q.notify({ type: 'positive', message: `${updated.name} updated successfully.` });
}

onMounted(loadContacts);
</script>
>>>>>>> dd61e66822affd435c62ff574219a347007efb96
