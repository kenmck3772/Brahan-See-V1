import { DirectoryNode } from './types';

export const initialFilesystem: DirectoryNode = {
  name: 'root',
  path: '/',
  type: 'directory',
  lastModified: '2026-06-01 12:00:00 UTC',
  children: [
    {
      name: 'sys',
      path: '/sys',
      type: 'directory',
      lastModified: '2026-06-01 04:30:11 UTC',
      children: [
        {
          name: 'trauma_node_alpha',
          path: '/sys/trauma_node_alpha',
          type: 'directory',
          lastModified: '2026-06-01 02:22:15 UTC',
          children: [
            {
              name: 'stress_matrix.conf',
              path: '/sys/trauma_node_alpha/stress_matrix.conf',
              type: 'file',
              size: '4.2 KB',
              traumaRating: 64,
              lastModified: '2026-05-31',
              anomalies: ['Pulsing depth shift detected (+4.2%)', 'Micro-fractures in structural integrity']
            },
            {
              name: 'telemetry.bin',
              path: '/sys/trauma_node_alpha/telemetry.bin',
              type: 'file',
              size: '128 KB',
              traumaRating: 25,
              lastModified: '2026-06-01'
            }
          ]
        },
        {
          name: 'trauma_node_beta',
          path: '/sys/trauma_node_beta',
          type: 'directory',
          lastModified: '2026-06-01 09:12:44 UTC',
          children: [
            {
              name: 'vector_force.sys',
              path: '/sys/trauma_node_beta/vector_force.sys',
              type: 'file',
              size: '11.8 KB',
              traumaRating: 94,
              lastModified: '2026-06-01',
              anomalies: ['CRITICAL STRESS COLLAPSE IMMINENT', 'Buffer overfill in sweep ring #2']
            },
            {
              name: 'stabilizer.log',
              path: '/sys/trauma_node_beta/stabilizer.log',
              type: 'file',
              size: '14 KB',
              traumaRating: 44,
              lastModified: '2026-06-01'
            }
          ]
        },
        {
          name: 'kernel',
          path: '/sys/kernel',
          type: 'directory',
          lastModified: '2026-05-20 18:29:10 UTC',
          children: [
            {
              name: 'core.ini',
              path: '/sys/kernel/core.ini',
              type: 'file',
              size: '1.2 KB',
              traumaRating: 12,
              lastModified: '2026-05-20'
            }
          ]
        }
      ]
    },
    {
      name: 'usr',
      path: '/usr',
      type: 'directory',
      lastModified: '2026-06-01 10:14:22 UTC',
      children: [
        {
          name: 'forensics',
          path: '/usr/forensics',
          type: 'directory',
          lastModified: '2026-06-01 11:23:45 UTC',
          children: [
            {
              name: 'registry',
              path: '/usr/forensics/registry',
              type: 'directory',
              lastModified: '2026-06-01 11:45:00 UTC',
              children: [
                {
                  name: 'active_sessions.db',
                  path: '/usr/forensics/registry/active_sessions.db',
                  type: 'file',
                  size: '4.8 MB',
                  traumaRating: 5,
                  lastModified: '2026-06-01'
                },
                {
                  name: 'unauthorized_access.log',
                  path: '/usr/forensics/registry/unauthorized_access.log',
                  type: 'file',
                  size: '450 KB',
                  traumaRating: 88,
                  lastModified: '2026-06-01',
                  anomalies: ['Unscheduled admin bypass at 21:04 UTC', 'MD5 signature mismatch on auth gate']
                }
              ]
            },
            {
              name: 'reports',
              path: '/usr/forensics/reports',
              type: 'directory',
              lastModified: '2026-06-01 01:22:00 UTC',
              children: [
                {
                  name: 'incident_01.txt',
                  path: '/usr/forensics/reports/incident_01.txt',
                  type: 'file',
                  size: '14 KB',
                  traumaRating: 15,
                  lastModified: '2026-05-29'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'var',
      path: '/var',
      type: 'directory',
      lastModified: '2026-06-01 07:11:00 UTC',
      children: [
        {
          name: 'log',
          path: '/var/log',
          type: 'directory',
          lastModified: '2026-06-01 07:15:00 UTC',
          children: [
            {
              name: 'integrity.err',
              path: '/var/log/integrity.err',
              type: 'file',
              size: '1.5 KB',
              traumaRating: 83,
              lastModified: '2026-06-01',
              anomalies: ['Diagnostic telemetry indicates Logic Fault / Integrity Compromised']
            }
          ]
        }
      ]
    }
  ]
};

export const defaultBookmarks = [
  { id: 'b1', name: 'SYS Trauma Node Alpha', path: '/sys/trauma_node_alpha', createdAt: '2026-06-01 12:00:00' },
  { id: 'b2', name: 'SYS Trauma Node Beta', path: '/sys/trauma_node_beta', createdAt: '2026-06-01 12:00:00' },
  { id: 'b3', name: 'Forensic Registry', path: '/usr/forensics/registry', createdAt: '2026-06-01 12:00:00' }
];
