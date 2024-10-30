import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const MapaAssentosGrafo = ({ dadosAssentos }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = window.innerWidth; // 100% width
    const height = window.innerHeight; // Full viewport height

    // Limpar o SVG antes de desenhar
    svg.selectAll("*").remove();

    // Adiciona o grupo de zoom
    const zoomLayer = svg.append("g");

    // Converter dadosAssentos em nós e links
    const nodes = [];
    const links = [];

    Object.entries(dadosAssentos).forEach(([mesa, convidados]) => {
      // Criar um nó para cada mesa
      nodes.push({
        id: `mesa-${mesa}`,
        name: `Mesa ${mesa}`,
        group: "mesa",
      });

      // Criar um nó para cada convidado e associá-lo à mesa
      convidados.forEach((convidado) => {
        nodes.push({
          id: `convidado-${convidado.name}`,
          name: convidado.name,
          group: "convidado",
          mesaId: mesa, // Adiciona o ID da mesa para cada convidado
        });

        // Criar um link entre a mesa e cada convidado
        links.push({
          source: `mesa-${mesa}`,
          target: `convidado-${convidado.name}`,
          type: "mesa",
        });

        // Criar links baseados em relacionamentos (Together ou Apart)
        convidado.relationships.forEach((relacionamento) => {
          const relType = relacionamento.includes("Junto com")
            ? "together"
            : "apart";
          const outroConvidado = relacionamento.split(": ")[1];

          // Agora verificamos a existência do outro convidado em todo o conjunto de dados
          const outroConvidadoNode = Object.values(dadosAssentos)
            .flat()
            .find((c) => c.name === outroConvidado);

          if (outroConvidadoNode) {
            // Criar link entre convidados, mesmo que estejam em mesas diferentes
            links.push({
              source: `convidado-${convidado.name}`,
              target: `convidado-${outroConvidadoNode.name}`,
              type: relType,
            });
          }
        });
      });
    });

    // Configuração da simulação
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((link) => {
            if (link.type === "together") {
              return 50; // Mais próximos
            } else if (link.type === "apart") {
              return 300; // Afastar mais os que querem ficar separados
            } else {
              return 100; // Distância padrão para a relação mesa-convidado
            }
          })
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    const link = zoomLayer
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", 2)
      .attr("stroke", (d) => {
        if (d.type === "together") return "cyan";
        if (d.type === "apart") return "red";
        return "black"; // Aresta preta para mesa-convidado
      })
      .style("stroke-dasharray", (d) => {
        return d.type === "apart" ? "8, 4" : "none";
      });

    const node = zoomLayer
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", (d) => (d.group === "mesa" ? "blue" : "#ddd"))
      .call(drag(simulation));

    const label = zoomLayer
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("x", 12)
      .attr("y", 3);

    function ticked() {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    }

    function drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Implementação do zoom
    const zoom = d3.zoom().on("zoom", (event) => {
      zoomLayer.attr("transform", event.transform);
    });

    // Configura o zoom no SVG
    svg.call(zoom).on("dblclick.zoom", null);

    // Tornar o gráfico responsivo ao tamanho da janela
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      svg.attr("width", newWidth).attr("height", newHeight);
      simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
      simulation.alpha(1).restart();
    };

    window.addEventListener("resize", handleResize);

    // Remover o listener quando o componente for desmontado
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dadosAssentos]);

  return <svg ref={svgRef} width="100%" height="100vh"></svg>;
};

export default MapaAssentosGrafo;
