XTool.registerComponent({
  name: 'timer-demo',
  template: `
    <div class="space-y-4">
      <div class="text-center">
        <div class="text-5xl font-bold text-blue-600 mb-4" x-text="seconds"></div>
        <p class="text-gray-600">Seconds elapsed</p>
      </div>
      <div class="flex gap-2 justify-center">
        <button x-on:click="start" 
                x-show="!running"
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          Start
        </button>
        <button x-on:click="stop" 
                x-show="running"
                class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
          Stop
        </button>
        <button x-on:click="reset" 
                class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
          Reset
        </button>
      </div>
    </div>
  `,
  
  makeData: () => ({
    seconds: 0,
    running: false,
    interval: null
  }),
  
  methods: {
    start() {
      if (this.running) return;
      this.running = true;
      this.interval = setInterval(() => {
        this.seconds++;
      }, 1000);
    },
    
    stop() {
      this.running = false;
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
    
    reset() {
      this.stop();
      this.seconds = 0;
    }
  },
  
  mounted() {
    console.log('Timer mounted');
  },
  
  beforeUnmount() {
    this.stop();
  },
  
  unmounted() {
    console.log('Timer unmounted');
  }
});
