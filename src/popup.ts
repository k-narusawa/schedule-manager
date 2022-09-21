'use strict';

(function () {
  function writeTime() {
    const realTime = new Date();
    const hour = realTime.getHours();
    const minutes = realTime.getMinutes();
    const seconds = realTime.getSeconds();
    const text = hour + ':' + minutes + ':' + seconds;
    document.getElementById('real-time')!.innerHTML = text;
  }

  window.onload = () => {
    setInterval(writeTime, 1000);
  };

  document.getElementById('btn')!.addEventListener('click', async () => {
    alert('button click');
  });
})();
