import { useState } from 'react';

// Node types matching the legend in the image
export type NodeType = 'political_leaders' | 'institutions' | 'opposition' | 'corporations' | 'independent';

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  x: number;
  y: number;
  size: number;
  description?: string;
  role?: string;
}

export interface Edge {
  source: string;
  target: string;
}

// Sample data representing the network graph
const nodes: Node[] = [
  // Tech CEOs and Leaders (Political Leaders = Tech Leaders)
  { id: '1', name: 'Satya Nadella', type: 'political_leaders', x: 450, y: 450, size: 50, role: 'CEO of Microsoft', description: 'Leading AI and cloud computing innovation' },
  { id: '2', name: 'Tim Cook', type: 'political_leaders', x: 550, y: 420, size: 50, role: 'CEO of Apple', description: 'Focuses on privacy and ecosystem integration' },
  { id: '3', name: 'Sundar Pichai', type: 'political_leaders', x: 520, y: 550, size: 50, role: 'CEO of Google/Alphabet', description: 'Leading search and AI development' },
  { id: '4', name: 'Jensen Huang', type: 'political_leaders', x: 380, y: 500, size: 45, role: 'CEO of NVIDIA', description: 'Pioneer in GPU and AI chips' },

  // Tech Companies (Corporations)
  { id: '5', name: 'Microsoft', type: 'corporations', x: 640, y: 380, size: 55, role: 'Technology Company', description: 'Software, cloud, and AI services' },
  { id: '6', name: 'Apple Inc.', type: 'corporations', x: 700, y: 480, size: 55, role: 'Consumer Electronics', description: 'iPhone, Mac, and services' },
  { id: '7', name: 'Google', type: 'corporations', x: 650, y: 600, size: 55, role: 'Internet Services', description: 'Search, ads, and cloud platform' },
  { id: '8', name: 'NVIDIA', type: 'corporations', x: 540, y: 720, size: 50, role: 'Semiconductor', description: 'GPU and AI hardware manufacturer' },
  { id: '9', name: 'OpenAI', type: 'corporations', x: 780, y: 380, size: 50, role: 'AI Research', description: 'ChatGPT and GPT models' },
  { id: '10', name: 'Meta', type: 'corporations', x: 800, y: 540, size: 45, role: 'Social Media', description: 'Facebook, Instagram, WhatsApp' },
  { id: '11', name: 'Amazon', type: 'corporations', x: 880, y: 450, size: 40, role: 'E-commerce & Cloud', description: 'AWS and retail platform' },

  // Institutions (Universities, Research, Regulatory)
  { id: '12', name: 'Stanford University', type: 'institutions', x: 480, y: 250, size: 50, role: 'Research Institution', description: 'Leading AI and CS research' },
  { id: '13', name: 'MIT', type: 'institutions', x: 360, y: 300, size: 45, role: 'Research Institution', description: 'Computer science and engineering' },
  { id: '14', name: 'Y Combinator', type: 'institutions', x: 200, y: 400, size: 40, role: 'Startup Accelerator', description: 'Seed funding and mentorship' },
  { id: '15', name: 'SEC', type: 'institutions', x: 470, y: 140, size: 40, role: 'Regulatory Body', description: 'Securities and Exchange Commission' },
  { id: '16', name: 'FTC', type: 'institutions', x: 600, y: 180, size: 40, role: 'Regulatory Body', description: 'Federal Trade Commission' },

  // Tech Investors & Independent Figures
  { id: '17', name: 'Sam Altman', type: 'independent', x: 680, y: 300, size: 45, role: 'CEO of OpenAI', description: 'Former Y Combinator president' },
  { id: '18', name: 'Elon Musk', type: 'independent', x: 300, y: 500, size: 50, role: 'CEO of Tesla & X', description: 'Entrepreneur and investor' },
  { id: '19', name: 'Marc Andreessen', type: 'independent', x: 280, y: 380, size: 40, role: 'Venture Capitalist', description: 'Co-founder of a16z' },
  { id: '20', name: 'Yann LeCun', type: 'independent', x: 790, y: 640, size: 35, role: 'Chief AI Scientist', description: 'Meta AI research leader' },
  { id: '21', name: 'Geoffrey Hinton', type: 'independent', x: 400, y: 180, size: 35, role: 'AI Pioneer', description: 'Deep learning researcher' },
  { id: '22', name: 'Demis Hassabis', type: 'independent', x: 580, y: 800, size: 35, role: 'CEO of DeepMind', description: 'Google AI research division' },

  // Critics & Opposition (Regulators, Critics, Competitors)
  { id: '23', name: 'Lina Khan', type: 'opposition', x: 350, y: 220, size: 45, role: 'FTC Chair', description: 'Big tech antitrust enforcement' },
  { id: '24', name: 'EU Commission', type: 'opposition', x: 540, y: 60, size: 45, role: 'Regulatory Body', description: 'Digital Markets Act enforcement' },
  { id: '25', name: 'Mozilla Foundation', type: 'opposition', x: 120, y: 500, size: 35, role: 'Non-profit', description: 'Open web advocacy' },
  { id: '26', name: 'EFF', type: 'opposition', x: 200, y: 600, size: 35, role: 'Rights Organization', description: 'Electronic Frontier Foundation' },
  { id: '27', name: 'Whistleblower Network', type: 'opposition', x: 90, y: 380, size: 30, role: 'Advocacy Group', description: 'Tech accountability activists' },
];

// Connections between nodes
const edges: Edge[] = [
  // CEOs to their companies
  { source: '1', target: '5' }, // Satya to Microsoft
  { source: '2', target: '6' }, // Tim to Apple
  { source: '3', target: '7' }, // Sundar to Google
  { source: '4', target: '8' }, // Jensen to NVIDIA

  // CEOs interconnected
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '2', target: '3' },
  { source: '3', target: '4' },

  // Companies to OpenAI
  { source: '5', target: '9' }, // Microsoft invested heavily in OpenAI
  { source: '7', target: '9' }, // Google competing with OpenAI
  { source: '6', target: '9' }, // Apple exploring AI partnerships

  // Sam Altman connections
  { source: '17', target: '9' }, // Sam runs OpenAI
  { source: '17', target: '14' }, // Former Y Combinator
  { source: '17', target: '1' }, // Works with Satya
  { source: '17', target: '5' }, // Microsoft partnership

  // Elon Musk connections
  { source: '18', target: '9' }, // Co-founded OpenAI (now competitor)
  { source: '18', target: '17' }, // Former partner with Sam
  { source: '18', target: '7' }, // Competed with Google
  { source: '18', target: '19' }, // Investor relationship

  // Universities to companies
  { source: '12', target: '5' }, // Stanford to Microsoft
  { source: '12', target: '6' }, // Stanford to Apple
  { source: '12', target: '7' }, // Stanford to Google
  { source: '12', target: '9' }, // Stanford to OpenAI
  { source: '13', target: '5' }, // MIT to Microsoft
  { source: '13', target: '6' }, // MIT to Apple

  // Marc Andreessen (VC)
  { source: '19', target: '14' }, // a16z to YC
  { source: '19', target: '5' }, // Investments
  { source: '19', target: '6' },
  { source: '19', target: '10' }, // Invested in Meta

  // AI Researchers
  { source: '21', target: '12' }, // Hinton at Stanford/Google
  { source: '21', target: '7' }, // Worked at Google
  { source: '20', target: '10' }, // Yann at Meta
  { source: '22', target: '7' }, // Demis at Google
  { source: '22', target: '3' },

  // Companies interconnected
  { source: '5', target: '6' },
  { source: '5', target: '7' },
  { source: '6', target: '7' },
  { source: '7', target: '8' }, // Google uses NVIDIA chips
  { source: '5', target: '8' }, // Microsoft uses NVIDIA chips
  { source: '8', target: '9' }, // OpenAI uses NVIDIA chips
  { source: '10', target: '8' }, // Meta uses NVIDIA chips
  { source: '11', target: '8' }, // Amazon uses NVIDIA chips

  // Regulatory pressure
  { source: '23', target: '5' }, // Khan targeting Microsoft
  { source: '23', target: '6' }, // Khan targeting Apple
  { source: '23', target: '7' }, // Khan targeting Google
  { source: '23', target: '10' }, // Khan targeting Meta
  { source: '23', target: '16' }, // Khan chairs FTC

  { source: '24', target: '6' }, // EU targeting Apple
  { source: '24', target: '7' }, // EU targeting Google
  { source: '24', target: '10' }, // EU targeting Meta
  { source: '24', target: '5' }, // EU targeting Microsoft

  { source: '15', target: '6' }, // SEC oversight
  { source: '15', target: '5' },
  { source: '15', target: '11' },

  { source: '16', target: '9' }, // FTC examining OpenAI
  { source: '16', target: '5' },

  // Opposition/advocacy groups
  { source: '25', target: '7' }, // Mozilla vs Google
  { source: '25', target: '6' }, // Mozilla vs Apple
  { source: '26', target: '7' }, // EFF monitoring Google
  { source: '26', target: '10' }, // EFF monitoring Meta
  { source: '26', target: '6' }, // EFF monitoring Apple
  { source: '27', target: '9' }, // Whistleblowers at OpenAI
  { source: '27', target: '10' }, // Whistleblowers at Meta

  // Cross connections
  { source: '14', target: '9' }, // YC ecosystem
  { source: '19', target: '18' }, // Investor connections
  { source: '21', target: '13' }, // Hinton at MIT
  { source: '1', target: '9' }, // Satya partnership with OpenAI
  { source: '10', target: '11' }, // Meta and Amazon compete
  { source: '6', target: '11' }, // Apple and Amazon compete
];

const nodeColors: Record<NodeType, string> = {
  political_leaders: '#2563eb', // Blue
  institutions: '#0d9488', // Teal
  opposition: '#b91c1c', // Red
  corporations: '#7c3aed', // Purple
  independent: '#6b7280', // Gray
};

const nodeLabels: Record<NodeType, string> = {
  political_leaders: 'Tech Leaders',
  institutions: 'Institutions',
  opposition: 'Opposition',
  corporations: 'Corporations',
  independent: 'Independent',
};

export function RelationshipGraph() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const handleNodeClick = (node: Node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  // Get connected node IDs for highlighting
  const getConnectedNodes = (nodeId: string): Set<string> => {
    const connected = new Set<string>();
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        connected.add(edge.target);
      }
      if (edge.target === nodeId) {
        connected.add(edge.source);
      }
    });
    return connected;
  };

  const activeNode = hoveredNode || selectedNode;
  const connectedNodes = activeNode ? getConnectedNodes(activeNode.id) : new Set<string>();

  // Check if an edge is connected to the selected node
  const isEdgeHighlighted = (edge: Edge): boolean => {
    if (!activeNode) return false;
    return edge.source === activeNode.id || edge.target === activeNode.id;
  };

  return (
    <div className="w-full h-full max-w-6xl max-h-[900px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl border-2 border-blue-300 p-8 flex flex-col">
      <div className="flex-1 relative">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 900"
          className="overflow-visible"
        >
          {/* Draw edges first (behind nodes) */}
          <g className="edges">
            {edges.map((edge, index) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const isHighlighted = isEdgeHighlighted(edge);
              const opacity = selectedNode ? (isHighlighted ? 0.6 : 0.1) : 0.3;
              const strokeWidth = isHighlighted ? 2.5 : 1.5;

              return (
                <line
                  key={`edge-${index}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isHighlighted ? nodeColors[sourceNode.type] : '#94a3b8'}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  className="transition-all duration-300"
                />
              );
            })}
          </g>

          {/* Draw nodes */}
          <g className="nodes">
            {nodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const isConnected = connectedNodes.has(node.id);
              const isHovered = hoveredNode?.id === node.id;
              const opacity = activeNode ? (isHovered || isSelected || isConnected ? 1 : 0.3) : 1;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-opacity duration-300 ease-out"
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Shadow/glow effect */}
                  <circle
                    r={node.size / 2 + 2}
                    fill="black"
                    opacity={0.08}
                    filter="blur(2px)"
                    transform="translate(0, 1)"
                  />

                  {/* Outer ring (white border) */}
                  <circle
                    r={node.size / 2 + 2}
                    fill="white"
                    opacity={opacity}
                    className="transition-opacity duration-300"
                  />

                  {/* Main node */}
                  <circle
                    r={node.size / 2}
                    fill={nodeColors[node.type]}
                    opacity={opacity}
                    className="transition-opacity duration-300"
                  />

                  {/* Selection indicator */}
                  {isSelected && (
                    <circle
                      r={node.size / 2 + 6}
                      fill="none"
                      stroke={nodeColors[node.type]}
                      strokeWidth="2.5"
                      opacity="0.7"
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Information Panel */}
        {activeNode && (
          <div className="absolute top-4 right-4 bg-white rounded-xl shadow-xl p-6 w-80 border border-gray-200 transition-opacity duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: nodeColors[activeNode.type] }}
                />
                <div>
                  <p className="text-xs text-gray-500">{nodeLabels[activeNode.type]}</p>
                  <h3 className="font-semibold text-gray-900">{activeNode.name}</h3>
                </div>
              </div>
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {activeNode.role && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="text-sm text-gray-700">{activeNode.role}</p>
              </div>
            )}

            {activeNode.description && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{activeNode.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-2">Connections</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(connectedNodes).map(nodeId => {
                  const connectedNode = nodes.find(n => n.id === nodeId);
                  if (!connectedNode) return null;
                  return (
                    <button
                      key={nodeId}
                      onClick={() => handleNodeClick(connectedNode)}
                      className="px-2 py-1 rounded-full text-xs bg-gray-100 hover:bg-gray-200 transition-colors"
                      style={{
                        borderLeft: `3px solid ${nodeColors[connectedNode.type]}`
                      }}
                    >
                      {connectedNode.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">{connectedNodes.size} connections</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-gray-300">
        {(Object.entries(nodeLabels) as [NodeType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: nodeColors[type] }}
            />
            <span className="text-sm text-gray-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}