import './jsdom-setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import '../pc-control-card.js';

const editor = () => document.createElement('pc-control-card-editor');

test('unflatten builds a drives array from flat fields', () => {
  const out = editor()._unflatten({
    status_entity: 'binary_sensor.nas',
    _drive_1_status: 'sensor.d1_status',
    _drive_1_temp: 'sensor.d1_temp',
    _drive_1_name: 'Drive 1',
    _drive_2_status: 'sensor.d2_status',
  });
  assert.deepEqual(out.drives, [
    { status: 'sensor.d1_status', temp: 'sensor.d1_temp', name: 'Drive 1' },
    { status: 'sensor.d2_status' },
  ]);
  assert.equal(out._drive_1_status, undefined);
});

test('flatten spreads a drives array into flat fields', () => {
  const flat = editor()._flatten({ status_entity: 'binary_sensor.nas', drives: [{ status: 'sensor.d1_status', name: 'Drive 1' }] });
  assert.equal(flat._drive_1_status, 'sensor.d1_status');
  assert.equal(flat._drive_1_name, 'Drive 1');
  assert.equal(flat._drive_2_status, undefined);
});

test('restart + uptime + icon keys survive the flatten/unflatten round-trip', () => {
  const cfg = {
    status_entity: 'binary_sensor.nas',
    uptime_entity: 'sensor.nas_uptime',
    restart: 'button.nas_reboot',
    confirm_restart: false,
    icon: 'nas',
  };
  const round = editor()._unflatten(editor()._flatten(cfg));
  assert.equal(round.uptime_entity, 'sensor.nas_uptime');
  assert.equal(round.restart, 'button.nas_reboot');
  assert.equal(round.confirm_restart, false);
  assert.equal(round.icon, 'nas');
});

test('metrics display settings and totals survive the round-trip', () => {
  const config = {
    status_entity: 'binary_sensor.nas',
    metrics: {
      cpu_usage: { entity: 'sensor.cpu', display: 'graph' },
      ram_usage: { entity: 'sensor.ram_used', total: 'sensor.ram_total' },
      custom: [{ entity: 'sensor.node', name: 'Node', display: 'bar' }],
    },
  };
  const ed = editor();
  ed._config = config;
  const round = ed._unflatten(ed._flatten(config));
  assert.deepEqual(round.metrics, config.metrics);
});

test('renders custom icons from Home Assistant namespaces', () => {
  for (const iconName of ['mdi:desktop-tower-monitor', 'mdi:package-variant-closed', 'phu:package-variant-closed']) {
    const card = document.createElement('pc-control-card');
    card.setConfig({ status_entity: 'binary_sensor.pc', icon: iconName });
    const icon = card.shadowRoot.querySelector('.header-icon');
    assert.ok(icon);
    assert.equal(icon.getAttribute('icon'), iconName);
  }
});
