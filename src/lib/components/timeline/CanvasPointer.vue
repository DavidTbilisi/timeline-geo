<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const CANVAS_HEIGHT = 40
const TIP_HEIGHT = 14  // height of the triangular tip

const canvasRef = ref<HTMLCanvasElement | null>(null)

function clearCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function drawPointer(cardRect: DOMRect, canvasRect: DOMRect) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Horizontal position relative to canvas
  const relLeft = cardRect.left - canvasRect.left
  const cardWidth = cardRect.width

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw a downward-pointing triangle centered on the card's horizontal center,
  // spanning the full card width at the top and narrowing to a tip at the bottom.
  const tipX = relLeft + cardWidth / 2
  const tipY = CANVAS_HEIGHT
  const baseLeft = relLeft
  const baseRight = relLeft + cardWidth

  ctx.beginPath()
  ctx.moveTo(baseLeft, 0)
  ctx.lineTo(baseRight, 0)
  ctx.lineTo(tipX, tipY - TIP_HEIGHT)
  ctx.closePath()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Small downward arrowhead tip
  ctx.beginPath()
  ctx.moveTo(tipX - 6, tipY - TIP_HEIGHT)
  ctx.lineTo(tipX, tipY)
  ctx.lineTo(tipX + 6, tipY - TIP_HEIGHT)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.fill()
}

function onMouseMove(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (!target) {
    clearCanvas()
    return
  }

  const card = target.closest('.tl-event') as HTMLElement | null
  if (!card) {
    clearCanvas()
    return
  }

  const canvas = canvasRef.value
  if (!canvas) return

  const cardRect = card.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()

  drawPointer(cardRect, canvasRect)
}

function onMouseOut(e: MouseEvent) {
  const related = e.relatedTarget as HTMLElement | null
  // Only clear if we left the stage area entirely
  if (!related || !related.closest('.tl-stage')) {
    clearCanvas()
  }
}

onMounted(() => {
  const stage = document.querySelector('.tl-stage')
  if (stage) {
    stage.addEventListener('mousemove', onMouseMove as EventListener)
    stage.addEventListener('mouseout', onMouseOut as EventListener)
  }
})

onUnmounted(() => {
  const stage = document.querySelector('.tl-stage')
  if (stage) {
    stage.removeEventListener('mousemove', onMouseMove as EventListener)
    stage.removeEventListener('mouseout', onMouseOut as EventListener)
  }
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="tl-canvas-pointer"
    :height="CANVAS_HEIGHT"
    aria-hidden="true"
  />
</template>

<style scoped>
.tl-canvas-pointer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  z-index: 15;
}
</style>
