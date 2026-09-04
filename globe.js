(() => {
  const canvas = document.getElementById("cyber-globe");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let radius = 0;
  let angle = 0.25;
  let animationId;

  const stars = Array.from({ length: 75 }, (_, index) => ({
    x: ((index * 73) % 997) / 997,
    y: ((index * 191) % 991) / 991,
    r: 0.35 + (index % 4) * 0.22,
    a: 0.18 + (index % 6) * 0.08
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    radius = Math.min(width, height) * 0.39;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function rotatePoint(lat, lon) {
    const phi = lat * Math.PI / 180;
    const theta = lon * Math.PI / 180 + angle;
    const x = Math.cos(phi) * Math.sin(theta);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(theta);
    return { x, y, z };
  }

  function project(point) {
    return {
      x: width / 2 + point.x * radius,
      y: height / 2 - point.y * radius,
      z: point.z
    };
  }

  function line(points, color, widthValue = 1) {
    context.beginPath();
    let drawing = false;
    points.forEach(point => {
      const screen = project(point);
      if (screen.z < -0.08) { drawing = false; return; }
      if (!drawing) context.moveTo(screen.x, screen.y);
      else context.lineTo(screen.x, screen.y);
      drawing = true;
    });
    context.strokeStyle = color;
    context.lineWidth = widthValue;
    context.stroke();
  }

  function drawGrid() {
    for (let lat = -60; lat <= 60; lat += 20) {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 4) points.push(rotatePoint(lat, lon));
      line(points, "rgba(67,189,232,.18)");
    }
    for (let lon = -180; lon < 180; lon += 20) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 3) points.push(rotatePoint(lat, lon));
      line(points, "rgba(67,189,232,.14)");
    }
  }

  function drawRoute(a, b, color, phase) {
    const start = project(rotatePoint(a[0], a[1]));
    const end = project(rotatePoint(b[0], b[1]));
    if (start.z < 0 || end.z < 0) return;
    const middleX = (start.x + end.x) / 2;
    const middleY = (start.y + end.y) / 2 - Math.min(95, Math.hypot(end.x-start.x,end.y-start.y)*.28);
    context.beginPath();
    context.moveTo(start.x,start.y);
    context.quadraticCurveTo(middleX,middleY,end.x,end.y);
    context.strokeStyle = color;
    context.lineWidth = 1.35;
    context.setLineDash([4,7]);
    context.lineDashOffset = -phase;
    context.stroke();
    context.setLineDash([]);
    [start,end].forEach(point => {
      context.beginPath(); context.arc(point.x,point.y,3.2,0,Math.PI*2);
      context.fillStyle=color; context.shadowColor=color; context.shadowBlur=13; context.fill(); context.shadowBlur=0;
    });
  }

  function draw(time = 0) {
    context.clearRect(0,0,width,height);
    stars.forEach(star => {
      context.globalAlpha=star.a; context.fillStyle="#c9f2ff"; context.fillRect(star.x*width,star.y*height,star.r,star.r);
    });
    context.globalAlpha=1;
    const glow=context.createRadialGradient(width/2,height/2,radius*.2,width/2,height/2,radius*1.2);
    glow.addColorStop(0,"rgba(19,99,139,.16)"); glow.addColorStop(.72,"rgba(5,45,66,.18)"); glow.addColorStop(1,"rgba(0,0,0,0)");
    context.fillStyle=glow; context.beginPath(); context.arc(width/2,height/2,radius*1.25,0,Math.PI*2); context.fill();
    context.beginPath(); context.arc(width/2,height/2,radius,0,Math.PI*2); context.fillStyle="rgba(4,23,34,.08)"; context.fill(); context.strokeStyle="rgba(78,201,245,.72)"; context.lineWidth=1.5; context.shadowColor="#43bde8"; context.shadowBlur=18; context.stroke(); context.shadowBlur=0;
    context.save(); context.beginPath(); context.arc(width/2,height/2,radius,0,Math.PI*2); context.clip(); drawGrid(); context.restore();
    const phase=(time/45)%22;
    drawRoute([35,-78],[48,2],"rgba(141,221,86,.9)",phase);
    drawRoute([48,2],[20,78],"rgba(208,163,77,.95)",phase+7);
    drawRoute([20,78],[-25,132],"rgba(168,121,232,.9)",phase+14);
    for(let ring=0;ring<3;ring++){
      context.beginPath(); context.ellipse(width/2,height/2+radius*.7,radius*(1.05+ring*.09),radius*(.18+ring*.025),0,0,Math.PI*2); context.strokeStyle=`rgba(67,189,232,${.18-ring*.04})`; context.stroke();
    }
    if (!reducedMotion) { angle += .0012; animationId=requestAnimationFrame(draw); }
  }

  const observer = new ResizeObserver(() => { resize(); if (reducedMotion) draw(); });
  observer.observe(canvas);
  resize(); draw();
  document.addEventListener("visibilitychange",()=>{
    if(reducedMotion)return;
    if(document.hidden) cancelAnimationFrame(animationId); else animationId=requestAnimationFrame(draw);
  });
})();
