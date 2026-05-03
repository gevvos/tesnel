import { ref, onMounted, type Ref } from 'vue';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';

export const useZoom = (svgRef: Ref<SVGSVGElement | null>) => {
  const transform = ref('translate(0,0) scale(1)');
  let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown>;

  onMounted(() => {
    if (!svgRef.value) return;

    zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 20])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform;
        transform.value = `translate(${x},${y}) scale(${k})`;
      });

    select(svgRef.value).call(zoomBehavior);
  });

  const resetZoom = () => {
    if (!svgRef.value) return;
    select(svgRef.value)
      .transition()
      .duration(300)
      .call(zoomBehavior.transform, zoomIdentity);
  };

  const zoomIn = () => {
    if (!svgRef.value) return;
    select(svgRef.value)
      .transition()
      .duration(200)
      .call(zoomBehavior.scaleBy, 1.3);
  };

  const zoomOut = () => {
    if (!svgRef.value) return;
    select(svgRef.value)
      .transition()
      .duration(200)
      .call(zoomBehavior.scaleBy, 0.7);
  };

  return { transform, resetZoom, zoomIn, zoomOut };
};
