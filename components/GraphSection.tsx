import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '../types';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface GraphSectionProps {
  data: GraphData | null;
}

const GraphSection: React.FC<GraphSectionProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State to track container width for responsive D3 rendering
  const [width, setWidth] = useState<number>(600);
  
  // Store D3 objects for external control
  const svgSelection = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const contentGroup = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  const height = 400;

  // Monitor container resize (crucial for layout transitions)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleZoomIn = () => {
    if (svgSelection.current && zoomBehavior.current) {
      svgSelection.current.transition().call(zoomBehavior.current.scaleBy, 1.2);
    }
  };

  const handleZoomOut = () => {
    if (svgSelection.current && zoomBehavior.current) {
      svgSelection.current.transition().call(zoomBehavior.current.scaleBy, 0.8);
    }
  };

  const handleZoomToFit = () => {
    if (!svgSelection.current || !zoomBehavior.current || !contentGroup.current) return;

    // Get the bounding box of the content
    const bounds = (contentGroup.current.node() as SVGGElement).getBBox();
    
    // Safety check for empty or invalid bounds
    if (bounds.width === 0 || bounds.height === 0) return;

    const padding = 40;
    const fullWidth = width;
    const fullHeight = height;
    
    const scale = Math.min(
      (fullWidth - padding * 2) / bounds.width,
      (fullHeight - padding * 2) / bounds.height
    );
    
    // Clamp scale to reasonable limits
    const safeScale = Math.min(Math.max(scale, 0.5), 2);

    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    const translate = [
      fullWidth / 2 - safeScale * midX,
      fullHeight / 2 - safeScale * midY
    ];

    svgSelection.current.transition().duration(750).call(
      zoomBehavior.current.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(safeScale)
    );
  };

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Create copy of data
    const nodes = data.nodes.map(d => ({ ...d })) as (GraphNode & d3.SimulationNodeDatum)[];
    const links = data.links.map(d => ({ ...d })) as (GraphLink & d3.SimulationLinkDatum<d3.SimulationNodeDatum>)[];

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);
    
    svgSelection.current = svg;

    // Create a container group for zooming
    const g = svg.append("g").attr("class", "graph-container");
    contentGroup.current = g;

    // Initialize Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    zoomBehavior.current = zoom;
    svg.call(zoom);

    // Disable double click zoom
    svg.on("dblclick.zoom", null);

    // Arrow Marker
    g.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#9ca3af");

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    // Draw Links
    const link = g.append("g")
      .selectAll("g")
      .data(links)
      .join("g");

    const linkPath = link.append("path")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", "url(#arrowhead)");

    const linkLabel = link.append("text")
      .text(d => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .attr("font-size", "12px")
      .attr("fill", "#6b7280")
      .attr("class", "bg-white px-1");

    // Draw Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 25)
      .attr("fill", d => {
        if (d.group === 0) return "#3b82f6";
        if (d.group === 2) return "#db2777";
        return "#f3f4f6";
      })
      .attr("stroke", d => {
        if (d.group === 1) return "#d1d5db";
        return "#fff";
      })
      .attr("stroke-width", 2)
      .attr("class", "shadow-sm cursor-pointer hover:stroke-brand-200 transition-colors");

    node.append("text")
      .text(d => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", d => {
        if (d.group === 1) return "#374151";
        return "white";
      })
      .attr("pointer-events", "none");

    // Simulation Tick
    simulation.on("tick", () => {
      linkPath.attr("d", (d: any) => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`);
      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Auto-fit after simulation settles a bit
    const timer = setTimeout(() => {
        handleZoomToFit();
    }, 800);

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
      clearTimeout(timer);
    };
  }, [data, width]); // Added width as dependency

  if (!data) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 h-fit">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
        关系图谱可视化
      </h2>
      <div 
        ref={containerRef} 
        className="w-full h-[400px] bg-slate-50 rounded-xl overflow-hidden border border-gray-100 relative group"
      >
        <svg ref={svgRef} className="w-full h-full block touch-none cursor-move"></svg>
        
        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-lg p-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-brand-600 transition-colors"
            title="放大"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-brand-600 transition-colors"
            title="缩小"
          >
            <ZoomOut size={18} />
          </button>
          <div className="h-px bg-gray-200 mx-1"></div>
          <button 
            onClick={handleZoomToFit}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 hover:text-brand-600 transition-colors"
            title="适应屏幕"
          >
            <Maximize size={18} />
          </button>
        </div>
        
        <div className="absolute top-4 left-4 text-xs text-gray-400 pointer-events-none opacity-60">
            支持拖拽与缩放
        </div>
      </div>
    </div>
  );
};

export default GraphSection;