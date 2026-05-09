<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const emit = defineEmits<{
  close: [];
}>();

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close');
};
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <button class="close-btn" @click="$emit('close')">&times;</button>
        <h2>Architecture Metrics</h2>
        <p class="subtitle">Based on Robert Martin's <em>Clean Architecture</em> component principles.</p>

        <section>
          <h3>Formulas</h3>
          <div class="formula">
            <strong>Instability (I)</strong> = Fan-out / (Fan-in + Fan-out)
            <p>How likely the module is to change. <code>0</code> = maximally stable (everything depends on it), <code>1</code> = maximally unstable (it depends on everything else).</p>
          </div>
          <div class="formula">
            <strong>Abstractness (A)</strong> = type-only imports / total imports
            <p>The ratio of <code>import type</code> edges to all incoming edges. <code>0</code> = fully concrete (runtime code), <code>1</code> = fully abstract (only types/interfaces).</p>
          </div>
          <div class="formula">
            <strong>Distance (D)</strong> = |A + I &minus; 1|
            <p>Distance from the Main Sequence. <code>0</code> = ideal balance between stability and abstractness. The further from zero, the more problematic.</p>
          </div>
        </section>

        <section>
          <h3>Fan-in / Fan-out</h3>
          <p><strong>Fan-in</strong> &mdash; how many modules depend on this one (incoming cross-boundary edges).</p>
          <p><strong>Fan-out</strong> &mdash; how many modules this one depends on (outgoing cross-boundary edges).</p>
          <p>Only edges that cross the module boundary are counted. Internal imports within the module are ignored.</p>
        </section>

        <section>
          <h3>Problem Zones</h3>
          <div class="zones">
            <div class="zone">
              <span class="zone-dot zone-dot--pain"></span>
              <div>
                <strong>Zone of Pain</strong> (I &asymp; 0, A &asymp; 0)
                <p>Concrete and stable. Everyone depends on it, but it has no abstraction layer. Any change here is painful and risky. Example: utility modules without interfaces.</p>
              </div>
            </div>
            <div class="zone">
              <span class="zone-dot zone-dot--useless"></span>
              <div>
                <strong>Zone of Uselessness</strong> (I &asymp; 1, A &asymp; 1)
                <p>Abstract and unstable. Abstractions that nobody uses &mdash; maximum effort, minimum value.</p>
              </div>
            </div>
            <div class="zone">
              <span class="zone-dot zone-dot--ok"></span>
              <div>
                <strong>Main Sequence</strong> (D &asymp; 0)
                <p>The ideal line from (A=1, I=0) to (A=0, I=1). Modules on or near it have a good balance &mdash; the more stable they are, the more abstract they should be.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3>Graph Colors</h3>
          <p class="hint">Only modules in problem zones or on the Main Sequence are highlighted. Others stay neutral.</p>
          <div class="color-legend">
            <div><span class="swatch swatch--red"></span> Zone of Pain &mdash; concrete + stable, hard to change</div>
            <div><span class="swatch swatch--purple"></span> Zone of Uselessness &mdash; abstract + unstable</div>
            <div><span class="swatch swatch--green"></span> Main Sequence &mdash; good balance (D &lt; 0.2)</div>
          </div>
        </section>

        <section>
          <h3>How to interpret</h3>
          <p>These metrics are a <strong>diagnostic tool</strong>, not a verdict. Being in a zone doesn't automatically mean there's a problem &mdash; context matters.</p>
          <div class="interpretation">
            <div class="interp-item">
              <strong>Zone of Pain is normal for some modules.</strong>
              <p>Constants, configs, shared utilities &mdash; they're concrete and stable by nature. Everyone imports them, and that's fine. The question is: would a change here cause a cascade of breakage? If yes, consider extracting an interface layer.</p>
            </div>
            <div class="interp-item">
              <strong>Zone of Uselessness is rare but wasteful.</strong>
              <p>If you see it, you likely have abstract types or interfaces that nothing actually uses. Either remove them or wire them into the codebase.</p>
            </div>
            <div class="interp-item">
              <strong>High Distance alone is not alarming.</strong>
              <p>D shows how far a module is from the ideal balance. A module with D=0.6 that works well and rarely changes is fine. Focus on modules where high D combines with frequent changes or known fragility.</p>
            </div>
            <div class="interp-item">
              <strong>Use metrics to guide refactoring, not to enforce rules.</strong>
              <p>Look for patterns: clusters of red modules, modules where every change breaks something, abstractions nobody uses. These metrics help you find them &mdash; the decision on what to do is yours.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  position: relative;
  background: #1a1f2e;
  border: 1px solid #2d3548;
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 560px;
  max-height: 80vh;
  overflow-y: auto;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.6;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 22px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #e2e8f0;
}

h2 {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.subtitle {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 20px;
}

h3 {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

section {
  margin-bottom: 20px;
}

.formula {
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(55, 65, 81, 0.25);
  border-radius: 6px;
}

.formula strong {
  color: #e2e8f0;
}

.formula p {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}

code {
  background: #374151;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
  color: #e2e8f0;
}

.zones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zone {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.zone p {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.zone-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 4px;
}

.zone-dot--pain { background: #ef4444; }
.zone-dot--useless { background: #a855f7; }
.zone-dot--ok { background: #22c55e; }

.color-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  vertical-align: middle;
  margin-right: 8px;
}

.swatch--green { background: rgba(34, 197, 94, 0.35); border: 1px solid #22c55e; }
.swatch--red { background: rgba(239, 68, 68, 0.35); border: 1px solid #ef4444; }
.swatch--purple { background: rgba(168, 85, 247, 0.35); border: 1px solid #a855f7; }

.hint {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.interpretation {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.interp-item {
  padding: 8px 12px;
  background: rgba(55, 65, 81, 0.2);
  border-left: 2px solid #4b5563;
  border-radius: 0 6px 6px 0;
}

.interp-item strong {
  color: #e2e8f0;
  font-size: 13px;
}

.interp-item p {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
