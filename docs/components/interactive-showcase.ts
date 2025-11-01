// Interactive Showcase component for homepage demo
import  { XTool, html } from 'fynejs';
// Highlights: Mustache interpolation, dynamic component switching, readonly freeze

// Apple Watch Component
XTool.registerComponent({
  name: 'apple-watch',
  template: html`
    <style>
      @keyframes numberPulse {
        0% { transform: scale(1); color: #fbbf24; }
        50% { transform: scale(1.2); color: #f59e0b; text-shadow: 0 0 10px #fbbf24; }
        100% { transform: scale(1); color: #fbbf24; }
      }
      
      .timer-number-display {
        animation: numberPulse 0.3s ease-out;
      }
      
      @keyframes buttonPress {
        0% { transform: scale(1) translateY(0); }
        50% { transform: scale(0.95) translateY(1px); }
        100% { transform: scale(1) translateY(0); }
      }
      
      .timer-button-pressed {
        animation: buttonPress 0.2s ease-out;
      }
    </style>
    
    <div class="relative mx-auto" style="width: 240px; height: 280px;">
      <!-- Watch case with realistic bezels -->
      <div class="relative w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl"
           style="border-radius: 60px;">
        
        <!-- Digital crown (on outer case) -->
        <div class="absolute -right-1 top-16 w-3 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-r-lg shadow-lg"></div>
        
        <!-- Interactive Side button (clickable with glow effect) -->
        <button x-on:click="switchWatchFace" 
                class="absolute -right-1 top-32 w-3 h-8 bg-gradient-to-r rounded-r-md shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none"
                x-class="{
                  'from-blue-500 to-blue-700 shadow-blue-500/50': currentFace === 'activity',
                  'from-orange-500 to-orange-700 shadow-orange-500/50': currentFace === 'digital',
                  'from-red-500 to-red-700 shadow-red-500/50': currentFace === 'news',
                  'from-green-500 to-green-700 shadow-green-500/50': currentFace === 'weather',
                  'from-purple-500 to-purple-700 shadow-purple-500/50': currentFace === 'music',
                  'from-yellow-500 to-yellow-700 shadow-yellow-500/50': currentFace === 'timer',
                  'from-indigo-500 to-indigo-700 shadow-indigo-500/50': currentFace === 'messages',
                  'from-pink-500 to-pink-700 shadow-pink-500/50': currentFace === 'photos'
                }">
          <!-- Subtle indicator dot -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-1 h-1 rounded-full animate-pulse"
                 x-class="{
                   'bg-blue-200': currentFace === 'activity',
                   'bg-orange-200': currentFace === 'digital',
                   'bg-red-200': currentFace === 'news',
                   'bg-green-200': currentFace === 'weather',
                   'bg-purple-200': currentFace === 'music',
                   'bg-yellow-200': currentFace === 'timer',
                   'bg-indigo-200': currentFace === 'messages',
                   'bg-pink-200': currentFace === 'photos'
                 }"></div>
          </div>
        </button>

        <!-- Outer bezel -->
        <div class="absolute inset-1 bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl"
             style="border-radius: 55px;">
          
          <!-- Inner screen bezel -->
          <div class="absolute inset-2 bg-black rounded-3xl shadow-inner"
               style="border-radius: 50px;">
            
            <!-- Screen content -->
            <div class="absolute inset-3 bg-black rounded-3xl overflow-hidden"
                 style="border-radius: 46px;">
              
              <!-- Always-on display glow -->
              <div class="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 animate-pulse"></div>
              
              <!-- Watch face content -->
              <div class="relative h-full flex flex-col text-white p-5">
                
                <!-- Activity Face (with rings) -->
                <template x-if="currentFace === 'activity'">
                  <div class="h-full flex flex-col">
                    <!-- Time display -->
                    <div class="text-center mb-6">
                      <div class="text-3xl font-light tracking-wider font-mono text-green-400 mb-2">
                        {{ currentTime }}
                      </div>
                      <div class="text-sm text-gray-400 uppercase tracking-widest">
                        {{ currentDate }}
                      </div>
                    </div>
                    
                    <!-- Activity rings (centered and prominent) -->
                    <div class="flex-1 flex justify-center items-center">
                      <div class="relative w-32 h-32">
                        <!-- Outer ring (Move) -->
                        <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" stroke-width="3"/>
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#ff006e" stroke-width="3" 
                                  stroke-linecap="round" stroke-dasharray="264" 
                                  x:style="{ strokeDashoffset: 264 - (steps / 1000 * 264) }"
                                  class="transition-all duration-1000 ease-out"/>
                        </svg>
                        
                        <!-- Middle ring (Exercise) -->
                        <svg class="absolute inset-3 w-26 h-26 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" stroke-width="3"/>
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#00f5ff" stroke-width="3" 
                                  stroke-linecap="round" stroke-dasharray="264"
                                  x:style="{ strokeDashoffset: 264 - (heartRate / 200 * 264) }"
                                  class="transition-all duration-1000 ease-out"/>
                        </svg>
                        
                        <!-- Inner ring (Stand) -->
                        <svg class="absolute inset-6 w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a1a" stroke-width="3"/>
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#7ed321" stroke-width="3" 
                                  stroke-linecap="round" stroke-dasharray="264"
                                  x:style="{ strokeDashoffset: 264 - (standHours / 12 * 264) }"
                                  class="transition-all duration-1000 ease-out"/>
                        </svg>
                        
                        <!-- Center activity summary -->
                        <div class="absolute inset-0 flex flex-col justify-center items-center text-center">
                          <div class="text-xl text-gray-300 font-medium">{{ totalActivity }}</div>
                          <div class="text-xs text-gray-500">CAL</div>
                        </div>
                      </div>
                    </div>
                    

                  </div>
                </template>

                <!-- Digital Face (with stats and controls) -->
                <template x-if="currentFace === 'digital'">
                  <div class="h-full flex flex-col justify-between p-3">
                    <!-- Header -->
                    <div class="text-center mb-3">
                      <div class="text-sm font-semibold text-blue-400 mb-0.5">Health Stats</div>
                      <div class="text-xs text-gray-500">Live Activity Data</div>
                    </div>
                    
                    <!-- Swipable Stats Row -->
                    <div class="mb-3">
                      <div id="stats-container" class="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style="scroll-snap-type: x mandatory;">
                        <div class="flex-shrink-0 text-center p-3 bg-gray-800/40 rounded-lg border border-gray-700/50 min-w-full" style="scroll-snap-align: center;">
                          <div class="text-2xl text-red-400 font-bold mb-1">{{ steps }}</div>
                          <div class="text-sm text-gray-400">STEPS</div>
                          <div class="text-xs text-gray-500 mt-1">Daily Goal: 10,000</div>
                        </div>
                        <div class="flex-shrink-0 text-center p-3 bg-gray-800/40 rounded-lg border border-gray-700/50 min-w-full" style="scroll-snap-align: center;">
                          <div class="text-2xl text-blue-400 font-bold mb-1">{{ heartRate }}</div>
                          <div class="text-sm text-gray-400">BPM</div>
                          <div class="text-xs text-gray-500 mt-1">Resting Rate</div>
                        </div>
                        <div class="flex-shrink-0 text-center p-3 bg-gray-800/40 rounded-lg border border-gray-700/50 min-w-full" style="scroll-snap-align: center;">
                          <div class="text-2xl text-green-400 font-bold mb-1">{{ standHours }}</div>
                          <div class="text-sm text-gray-400">HOURS</div>
                          <div class="text-xs text-gray-500 mt-1">Stand Goal: 12</div>
                        </div>
                        <div class="flex-shrink-0 text-center p-3 bg-gray-800/40 rounded-lg border border-gray-700/50 min-w-full" style="scroll-snap-align: center;">
                          <div class="text-2xl text-orange-400 font-bold mb-1">{{ totalActivity }}</div>
                          <div class="text-sm text-gray-400">CALORIES</div>
                          <div class="text-xs text-gray-500 mt-1">Active Energy</div>
                        </div>
                      </div>
                      <!-- Swipe indicator -->
                      <div class="flex justify-center mt-1">
                        <div class="flex gap-0.5">
                          <button x-on:click="scrollToStat(0)"
                                  class="w-1 h-1 rounded-full transition-colors cursor-pointer hover:scale-125 transform"
                                  x-class="currentStatsIndex === 0 ? 'bg-red-400' : 'bg-gray-600 hover:bg-gray-500'"></button>
                          <button x-on:click="scrollToStat(1)"
                                  class="w-1 h-1 rounded-full transition-colors cursor-pointer hover:scale-125 transform"
                                  x-class="currentStatsIndex === 1 ? 'bg-blue-400' : 'bg-gray-600 hover:bg-gray-500'"></button>
                          <button x-on:click="scrollToStat(2)"
                                  class="w-1 h-1 rounded-full transition-colors cursor-pointer hover:scale-125 transform"
                                  x-class="currentStatsIndex === 2 ? 'bg-green-400' : 'bg-gray-600 hover:bg-gray-500'"></button>
                          <button x-on:click="scrollToStat(3)"
                                  class="w-1 h-1 rounded-full transition-colors cursor-pointer hover:scale-125 transform"
                                  x-class="currentStatsIndex === 3 ? 'bg-orange-400' : 'bg-gray-600 hover:bg-gray-500'"></button>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Interactive control (compact toggle) -->
                    <div class="flex justify-center mb-1">
                      <button x-on:click="toggleActivitySimulation" 
                              class="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all duration-200 transform hover:scale-105"
                              x-class="isActivityRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
                        <!-- Start icon -->
                        <svg x-show="!isActivityRunning" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L14 10.202l-4.445-3.034z"/>
                        </svg>
                        <!-- Reset icon -->
                        <svg x-show="isActivityRunning" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                        </svg>
                        <span class="text-white font-medium" x-text="isActivityRunning ? 'RESET' : 'START'"></span>
                      </button>
                    </div>
                  

                  </div>
                </template>

                <!-- News Face -->
                <template x-if="currentFace === 'news'">
                  <div class="h-full flex flex-col justify-between p-2">
                    <!-- Header -->
                    <div class="text-center mb-2">
                      <div class="text-sm font-semibold text-red-400 mb-0.5">📰 News</div>
                      <div class="text-xs text-gray-500">{{ currentTime }}</div>
                    </div>
                    
                    <!-- Swipable News Articles -->
                    <div class="flex-1 flex flex-col justify-center">
                      <div id="news-container" class="flex gap-2 overflow-x-auto scrollbar-hide pb-1 *:max-w-full" style="scroll-snap-type: x mandatory;">
                        <div x-for="(article, index) in newsArticles" 
                             class="flex-shrink-0 bg-gray-800/40 rounded-lg border border-gray-700/50 p-2 min-w-full" 
                             style="scroll-snap-align: center;">
                          <div class="text-sm font-semibold text-white mb-2 leading-tight ">
                            {{ article.title }}
                          </div>
                          <div class="flex justify-between text-xs text-gray-400">
                            <span class="truncate mr-2">{{ article.source }}</span>
                            <span class="flex-shrink-0">{{ article.time }}</span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Swipe indicator dots -->
                      <div class="flex justify-center gap-1 mt-2">
                        <button x-for="(article, index) in newsArticles" 
                                x-on:click="scrollToNews(index)"
                                class="w-1.5 h-1.5 rounded-full transition-colors cursor-pointer hover:scale-125 transform"
                                x-class="index === currentNewsIndex ? 'bg-red-400' : 'bg-gray-600 hover:bg-gray-500'"></button>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Weather Face -->
                <template x-if="currentFace === 'weather'">
                  <div class="h-full flex flex-col justify-between p-2">
                    <!-- Header -->
                    <div class="text-center mb-2">
                      <div class="text-sm font-semibold text-green-400 mb-0.5">🌤️ Weather</div>
                      <div class="text-xs text-gray-400 truncate">{{ weatherLocation }}</div>
                    </div>
                    
                    <!-- Weather display -->
                    <div class="flex-1 flex flex-col justify-center items-center">
                      <!-- Weather icon and temp -->
                      <div class="text-center">
                        <div class="text-4xl mb-2 cursor-pointer transform hover:scale-110 transition-transform" 
                             x-on:click="changeWeather">
                          {{ weatherData[currentWeather].icon }}
                        </div>
                        <div class="text-2xl font-bold text-green-400 mb-1">{{ weatherData[currentWeather].temp }}°C</div>
                        <div class="text-sm text-gray-400">{{ weatherData[currentWeather].desc }}</div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Music Face -->
                <template x-if="currentFace === 'music'">
                  <div class="h-full flex flex-col justify-between p-2">
                    <!-- Header -->
                    <div class="text-center mb-2">
                      <div class="text-sm font-semibold text-purple-400 mb-0.5">🎵 Music</div>
                      <div class="text-xs text-gray-500">{{ isPlaying ? 'Playing' : 'Paused' }}</div>
                    </div>
                    
                    <!-- Track info -->
                    <div class="flex-1 flex flex-col justify-center">
                      <!-- Vinyl record animation -->
                      <div class="flex justify-center mb-2">
                        <div class="relative">
                          <div class="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center"
                               x-class="isPlaying ? 'animate-spin' : ''"
                               style="animation-duration: 2s;">
                            <div class="w-3 h-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full"></div>
                            <div class="absolute inset-1 border border-gray-600 rounded-full"></div>
                          </div>
                          <!-- Playing indicator -->
                          <div class="absolute -right-0.5 top-1/2 transform -translate-y-1/2"
                               x-show="isPlaying">
                            <div class="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Track details -->
                      <div class="text-center mb-2">
                        <div class="text-sm font-semibold text-white mb-1 truncate">{{ musicTracks[currentTrackIndex].title }}</div>
                        <div class="text-xs text-gray-400 truncate">{{ musicTracks[currentTrackIndex].artist }}</div>
                      </div>
                      
                      <!-- Progress bar -->
                      <div class="mb-2">
                        <div class="w-full bg-gray-700 rounded-full h-1">
                          <div class="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full transition-all duration-500"
                               x-style="{ width: (currentPlayTime / musicTracks[currentTrackIndex].duration * 100) + '%' }"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{{ formatTime(currentPlayTime) }}</span>
                          <span>{{ formatTime(musicTracks[currentTrackIndex].duration) }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Music controls -->
                    <div class="flex justify-center gap-2">
                      <button x-on:click="previousTrack" 
                              class="p-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
                        </svg>
                      </button>
                      
                      <button x-on:click="togglePlayback" 
                              class="p-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" x-show="!isPlaying">
                          <path d="M8 5v10l7-5-7-5z"/>
                        </svg>
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" x-show="isPlaying">
                          <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"/>
                        </svg>
                      </button>
                      
                      <button x-on:click="nextTrack" 
                              class="p-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>

                <!-- Timer Face -->
                <template x-if="currentFace === 'timer'">
                  <div class="h-full flex flex-col justify-between p-2">
                    <!-- Header -->
                    <div class="text-center mb-2">
                      <div class="text-sm font-semibold text-yellow-400 mb-0.5">⏱️ Timer</div>
                      <div class="text-xs text-gray-500">{{ timerRunning ? 'Running' : 'Stopped' }}</div>
                    </div>
                    
                    <!-- Timer display -->
                    <div class="flex-1 flex flex-col justify-center items-center">
                      <!-- Timer circle (only when running) -->
                      <div x-show="timerRunning" class="relative w-24 h-24 mb-3">
                        <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" stroke-width="4"/>
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" stroke-width="4" 
                                  stroke-linecap="round" stroke-dasharray="283" 
                                  x-style="{ strokeDashoffset: 283 - (timerProgress * 283) }"
                                  class="transition-all duration-1000 ease-out"/>
                        </svg>
                        
                        <!-- Timer display -->
                        <div class="absolute inset-0 flex flex-col justify-center items-center text-center">
                          <div class="text-lg font-mono text-yellow-400 font-bold">{{ formatTimer(timerSeconds) }}</div>
                          <div class="text-xs text-gray-500">{{ timerDuration }}s</div>
                        </div>
                      </div>
                      
                      <!-- Timer Setting (when not running) -->
                      <div x-show="!timerRunning" class="flex flex-col items-center gap-4 mb-3">
                        <!-- Enhanced Minutes and Seconds inputs -->
                        <div class="flex items-center gap-4">
                          <!-- Minutes Column -->
                          <div class="flex flex-col items-center gap-1">
                            <button x-on:click="adjustTimer('minutes', 1)" 
                                    class="w-10 h-8 text-yellow-400 font-bold focus:outline-none">
                              <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" transform="rotate(180 10 10)"/>
                              </svg>
                            </button>
                            
                            <div class="relative">
                              <div class="w-12 h-10 bg-gradient-to-b from-gray-700 to-gray-800 border-2 border-yellow-500/30 rounded-lg flex items-center justify-center shadow-inner">
                                <div class="timer-number-display text-lg font-mono font-bold text-yellow-400 transition-all duration-300 ease-out transform">
                                  {{ Math.floor(timerInputSeconds / 60) }}
                                </div>
                              </div>
                              <div class="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
                                <div class="text-xs text-gray-400 font-medium pointer-events-none">MIN</div>
                              </div>
                            </div>
                            
                            <button x-on:click="adjustTimer('minutes', -1)" 
                                    class="w-10 h-8 text-yellow-400 font-bold focus:outline-none mt-1">
                              <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                              </svg>
                            </button>
                          </div>
                          
                          <!-- Separator -->
                          <div class="text-yellow-400 text-2xl font-bold">:</div>
                          
                          <!-- Seconds Column -->
                          <div class="flex flex-col items-center gap-1">
                            <button x-on:click="adjustTimer('seconds', 15)" 
                                    class="w-10 h-8 text-yellow-400 font-bold focus:outline-none">
                              <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" transform="rotate(180 10 10)"/>
                              </svg>
                            </button>
                            
                            <div class="relative">
                              <div class="w-12 h-10 bg-gradient-to-b from-gray-700 to-gray-800 border-2 border-yellow-500/30 rounded-lg flex items-center justify-center shadow-inner">
                                <div class="timer-number-display text-lg font-mono font-bold text-yellow-400 transition-all duration-300 ease-out transform">
                                  {{ String(timerInputSeconds % 60).padStart(2, '0') }}
                                </div>
                              </div>
                              <div class="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
                                <div class="text-xs text-gray-400 font-medium pointer-events-none">SEC</div>
                              </div>
                            </div>
                            
                            <button x-on:click="adjustTimer('seconds', -15)" 
                                    class="w-10 h-8 text-yellow-400 font-bold focus:outline-none mt-1">
                              <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Timer controls -->
                    <div class="flex justify-center gap-2">
                      <button x-on:click="toggleTimer" 
                              class="px-3 py-1 rounded text-xs transition-all"
                              x-class="timerRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
                        <span x-text="timerRunning ? 'STOP' : 'START'"></span>
                      </button>
                    </div>
                  </div>
                </template>

                <!-- Messages Face -->
                <template x-if="currentFace === 'messages'">
                  <div class="h-full flex flex-col p-2">
                    <!-- Header -->
                    <div class="text-center mb-2">
                      <div class="text-sm font-semibold text-indigo-400 mb-0.5">💬 Messages</div>
                      <div class="text-xs text-gray-500">
                        <span x-show="selectedMessageIndex === -1">{{ messages.length }} unread</span>
                        <button x-show="selectedMessageIndex !== -1" x-on:click="selectedMessageIndex = -1" class="text-indigo-400 hover:text-indigo-300">← Back to list</button>
                      </div>
                    </div>
                    
                    <!-- Messages List View -->
                    <div x-show="selectedMessageIndex === -1" class="flex-1 overflow-hidden">
                      <div class="h-full overflow-y-auto scrollbar-hide">
                        <div x-for="(message, index) in messages" class="mb-2">
                          <button x-on:click="selectedMessageIndex = index" 
                                  class="w-full text-left p-2 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg border border-gray-700/50 transition-colors">
                            <div class="flex items-center mb-1">
                              <div class="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-xs mr-2">
                                {{ message.sender.charAt(0) }}
                              </div>
                              <div class="flex-1 min-w-0">
                                <div class="text-sm font-semibold text-white truncate">{{ message.sender }}</div>
                                <div class="text-xs text-gray-400">{{ message.time }}</div>
                              </div>
                            </div>
                            <div class="text-xs text-gray-300 truncate ml-7">
                              {{ message.text }}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Individual Message View -->
                    <div x-show="selectedMessageIndex !== -1" class="flex-1 overflow-hidden">
                      <div class="h-full overflow-y-auto scrollbar-hide">
                        <div x-show="selectedMessageIndex !== -1" class="bg-gray-800/40 rounded-lg border border-gray-700/50 p-3 h-full">
                          <div class="flex items-center mb-3">
                            <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm mr-3">
                              {{ selectedMessageIndex !== -1 ? messages[selectedMessageIndex].sender.charAt(0) : '' }}
                            </div>
                            <div class="flex-1">
                              <div class="text-sm font-semibold text-white">
                                {{ selectedMessageIndex !== -1 ? messages[selectedMessageIndex].sender : '' }}
                              </div>
                              <div class="text-xs text-gray-400">
                                {{ selectedMessageIndex !== -1 ? messages[selectedMessageIndex].time : '' }}
                              </div>
                            </div>
                          </div>
                          <div class="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{{ selectedMessageIndex !== -1 ? messages[selectedMessageIndex].text : '' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Photos Face -->
                <template x-if="currentFace === 'photos'">
                  <div class="h-full flex flex-col" x-class="photoFullscreen ? 'p-0' : 'p-2'">
                    <!-- Header (hidden in fullscreen) -->
                    <div x-show="!photoFullscreen" class="text-center mb-2">
                      <div class="text-sm font-semibold text-pink-400 mb-0.5">📸 Photos</div>
                      <div class="text-xs text-gray-500">{{ photos.length }} memories</div>
                    </div>
                    
                    <!-- Photo Display -->
                    <div class="flex-1 flex flex-col justify-center">
                      <!-- Swipable Photo Container -->
                      <div id="photos-container" class="relative flex gap-2 overflow-x-auto scrollbar-hide" 
                           x-class="photoFullscreen ? 'mb-0' : 'mb-2'" 
                           style="scroll-snap-type: x mandatory;">
                        <div x-for="(photo, index) in photos" 
                             class="flex-shrink-0 bg-gray-800/40 rounded-lg border border-gray-700/50 overflow-hidden min-w-full relative" 
                             style="scroll-snap-align: center;">
                          <div class="aspect-square flex items-center justify-center"
                               x-on:click="togglePhotoFullscreen(index)">
                            <!-- Photo placeholder with gradient background -->
                            <div class="w-full h-full bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 flex items-center justify-center text-white cursor-pointer">
                              <div x-class="photoFullscreen ? 'text-6xl' : 'text-4xl'">{{ photo.emoji }}</div>
                            </div>
                          </div>
                          
                          <!-- Fullscreen info overlay (only in fullscreen) -->
                          <div x-show="photoFullscreen && index === currentPhotoIndex" 
                               class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                            <div class="text-center">
                              <div class="text-sm font-semibold text-white truncate">{{ photo.title }}</div>
                              <div class="text-xs text-gray-300 truncate">{{ photo.date }} • {{ photo.location }}</div>
                              <div class="text-xs text-gray-400 mt-1">{{ currentPhotoIndex + 1 }} / {{ photos.length }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Photo indicator dots (hidden in fullscreen) -->
                      <div x-show="!photoFullscreen" class="flex justify-center gap-1">
                        <button x-for="(photo, index) in photos" 
                                x-on:click="scrollToPhoto(index)"
                                class="w-1.5 h-1.5 rounded-full transition-colors focus:outline-none"
                                x-class="index === currentPhotoIndex ? 'bg-pink-400' : 'bg-gray-600'"></button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Subtle reflection effect -->
        <div class="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-3xl pointer-events-none"
             style="border-radius: 50px;"></div>
      </div>
    </div>
  `,
  makeData: () => ({ 
    currentTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    currentDate: new Date().toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'}).toUpperCase(),
    steps: 7842,
    heartRate: 72,
    standHours: 8,
    totalActivity: 420,
    isActive: true,
    currentFace: 'activity', // 'activity', 'digital', 'news', 'weather', 'music'
    timeTimer: null as number | null,
    faces: ['activity', 'digital', 'news', 'weather', 'music', 'timer', 'messages', 'photos'],
    currentFaceIndex: 0,
    // News data
    newsArticles: [
      { title: 'Tech Giants Release Q3 Results', source: 'TechNews', time: '2h ago' },
      { title: 'Climate Summit Begins Today', source: 'WorldNews', time: '4h ago' },
      { title: 'New AI Breakthrough Announced', source: 'ScienceToday', time: '6h ago' },
      { title: 'Market Reaches All-Time High', source: 'FinanceWatch', time: '8h ago' }
    ],
    currentNewsIndex: 0,
    currentStatsIndex: 0,
    isActivityRunning: false,
    activityTimer: null as number | null,
    // Weather data
    currentWeather: 'sunny',
    temperature: 24,
    weatherLocation: 'San Francisco',
    weatherTypes: ['sunny', 'rainy', 'cloudy', 'snowy'],
    weatherData: {
      sunny: { temp: 24, icon: '☀️', desc: 'Sunny' },
      rainy: { temp: 16, icon: '🌧️', desc: 'Rainy' },
      cloudy: { temp: 20, icon: '☁️', desc: 'Cloudy' },
      snowy: { temp: -2, icon: '❄️', desc: 'Snowy' }
    },
    // Music data
    isPlaying: false,
    currentTrackIndex: 0,
    playbackTimer: null as number | null,
    musicTracks: [
      { title: 'Digital Dreams', artist: 'X-Tool Orchestra', duration: 180 },
      { title: 'Code Symphony', artist: 'Dev Harmonics', duration: 200 },
      { title: 'Reactive Waves', artist: 'Framework Five', duration: 165 }
    ],
    currentPlayTime: 45,
    // Timer data
    timerSeconds: 60,
    timerDuration: 60,
    timerRunning: false,
    timerProgress: 0,
    timerInterval: null as number | null,
    // Messages data
    messages: [
      { sender: 'Sarah Chen', text: 'Hey! Are we still on for lunch today?', time: '2m ago' },
      { sender: 'Dev Team', text: 'Code review meeting moved to 3pm', time: '15m ago' },
      { sender: 'Mom', text: 'Call me when you get a chance ❤️', time: '1h ago' },
      { sender: 'GitHub', text: 'Your pull request has been merged', time: '2h ago' }
    ],
    currentMessageIndex: 0,
    selectedMessageIndex: -1, // -1 means list view, >= 0 means individual message view
    timerInputSeconds: 60, // For timer input interface
    // Photos data
    photos: [
      { title: 'Mountain Sunrise', emoji: '🏔️', date: 'Oct 12, 2025', location: 'Yosemite National Park' },
      { title: 'City Lights', emoji: '🌃', date: 'Oct 10, 2025', location: 'San Francisco, CA' },
      { title: 'Beach Sunset', emoji: '🏖️', date: 'Oct 8, 2025', location: 'Santa Monica, CA' },
      { title: 'Forest Trail', emoji: '🌲', date: 'Oct 5, 2025', location: 'Redwood Forest' },
      { title: 'Desert Landscape', emoji: '🏜️', date: 'Oct 1, 2025', location: 'Joshua Tree' }
    ],
    currentPhotoIndex: 0,
    photoFullscreen: false
  }),
  methods: {
    // Activity methods
    simulateActivity() {
      this.isActive = true;
      this.steps += Math.floor(Math.random() * 100) + 50;
      this.heartRate = Math.min(180, Math.max(60, this.heartRate + Math.floor(Math.random() * 20) - 10));
      this.totalActivity += Math.floor(Math.random() * 50) + 10;
      
      // Animate the rings
      if (Math.random() > 0.7) {
        this.standHours = Math.min(12, this.standHours + 1);
      }
    },
    resetActivity() {
      this.steps = 0;
      this.heartRate = 65;
      this.standHours = 0;
      this.totalActivity = 0;
      this.isActive = false;
    },
    toggleActivitySimulation() {
      if (this.isActivityRunning) {
        // Stop simulation and reset
        this.isActivityRunning = false;
        if (this.activityTimer) {
          clearInterval(this.activityTimer);
          this.activityTimer = null;
        }
        this.resetActivity();
      } else {
        // Start simulation
        this.isActivityRunning = true;
        this.isActive = true;
        this.activityTimer = setInterval(() => {
          this.simulateActivity();
        }, 2000); // Update every 2 seconds
      }
    },
    
    // Face switching
    switchWatchFace() {
      this.currentFaceIndex = (this.currentFaceIndex + 1) % this.faces.length;
      this.currentFace = this.faces[this.currentFaceIndex];
      
      // Set up photo scroll tracking if switching to photos face
      if (this.currentFace === 'photos') {
        setTimeout(() => this.setupPhotoScrollTracking(), 100);
      }
    },
    
    // Time update
    updateTime() {
      this.currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      this.currentDate = new Date().toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'}).toUpperCase();
    },
    
    // News methods
    nextNews() {
      this.currentNewsIndex = (this.currentNewsIndex + 1) % this.newsArticles.length;
    },
    previousNews() {
      this.currentNewsIndex = this.currentNewsIndex === 0 ? this.newsArticles.length - 1 : this.currentNewsIndex - 1;
    },
    scrollToNews(index:number) {
      this.currentNewsIndex = index;
      const container = document.getElementById('news-container');
      if (container) {
        const cardWidth = (container.children[0] as HTMLElement).offsetWidth;
        const scrollPosition = index * (cardWidth + 8); // 8px gap
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    },
    
    // Stats methods
    scrollToStat(index:number) {
      this.currentStatsIndex = index;
      const container = document.getElementById('stats-container');
      if (container) {
        const cardWidth = (container.children[0] as HTMLElement).offsetWidth;
        const scrollPosition = index * (cardWidth + 8); // 8px gap
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    },
    
    // Weather methods
    changeWeather() {
      const currentIndex = this.weatherTypes.indexOf(this.currentWeather);
      this.currentWeather = this.weatherTypes[(currentIndex + 1) % this.weatherTypes.length];
    },
    changeLocation() {
      const locations = ['San Francisco', 'New York', 'London', 'Tokyo'];
      const currentIndex = locations.indexOf(this.weatherLocation);
      this.weatherLocation = locations[(currentIndex + 1) % locations.length];
    },
    refreshWeather() {
      // Simulate weather refresh with slight changes
      const data = this.weatherData[this.currentWeather as keyof typeof this.weatherData];
      data.temp += Math.floor(Math.random() * 4) - 2; // ±2 degrees
    },
    
    // Music methods
    togglePlayback() {
      this.isPlaying = !this.isPlaying;
      
      if (this.isPlaying) {
        this.playbackTimer = setInterval(() => {
          if (this.currentPlayTime < this.musicTracks[this.currentTrackIndex].duration) {
            this.currentPlayTime++;
          } else {
            this.nextTrack();
          }
        }, 1000);
      } else {
        clearInterval(this.playbackTimer!);
      }
    },
    nextTrack() {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
      this.currentPlayTime = 0;
    },
    previousTrack() {
      this.currentTrackIndex = this.currentTrackIndex === 0 ? this.musicTracks.length - 1 : this.currentTrackIndex - 1;
      this.currentPlayTime = 0;
    },
    formatTime(seconds:number) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Timer methods
    setTimer(seconds:number) {
      this.timerSeconds = seconds;
      this.timerDuration = seconds;
      this.timerInputSeconds = seconds;
      this.timerProgress = 0;
      this.timerRunning = false;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    },
    setTimerInput(seconds:number) {
      this.timerInputSeconds = seconds;
      this.timerSeconds = seconds;
      this.timerDuration = seconds;
      this.timerProgress = 0;
    },
    adjustTimer(type:string, amount:number) {
      if (type === 'minutes') {
        this.timerInputSeconds = Math.max(0, Math.min(3600, this.timerInputSeconds + (amount * 60)));
      } else if (type === 'seconds') {
        this.timerInputSeconds = Math.max(0, Math.min(3600, this.timerInputSeconds + amount));
      }
      this.timerSeconds = this.timerInputSeconds;
      this.timerDuration = this.timerInputSeconds;
      this.timerProgress = 0;
      
      // Trigger number animation
      const displays = document.querySelectorAll('.timer-number-display') as NodeListOf<HTMLElement>;
      displays.forEach(display => {
        display.style.animation = 'none';
        display.offsetHeight; // Trigger reflow
        display.style.animation = 'numberPulse 0.3s ease-out';
      });
    },
    toggleTimer() {
      if (this.timerRunning) {
        this.timerRunning = false;
        clearInterval(this.timerInterval!);
      } else {
        // Use the input value when starting
        this.timerSeconds = this.timerInputSeconds;
        this.timerDuration = this.timerInputSeconds;
        this.timerProgress = 0;
        
        this.timerRunning = true;
        this.timerInterval = setInterval(() => {
          if (this.timerSeconds > 0) {
            this.timerSeconds--;
            this.timerProgress = (this.timerDuration - this.timerSeconds) / this.timerDuration;
          } else {
            this.timerRunning = false;
            clearInterval(this.timerInterval!);
          }
        }, 1000);
      }
    },
    formatTimer(seconds:number) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Messages methods
    scrollToMessage(index:number) {
      this.currentMessageIndex = index;
      const container = document.getElementById('messages-container');
      if (container) {
        const cardWidth = (container.children[0] as HTMLElement).offsetWidth;
        const scrollPosition = index * (cardWidth + 8);
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    },
    
    // Photos methods
    scrollToPhoto(index:number) {
      this.currentPhotoIndex = index;
      const container = document.getElementById('photos-container');
      if (container) {
        const cardWidth = (container.children[0] as HTMLElement).offsetWidth;
        const scrollPosition = index * (cardWidth + 8);
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    },
    nextPhoto() {
      const nextIndex = (this.currentPhotoIndex + 1) % this.photos.length;
      this.scrollToPhoto(nextIndex);
    },
    previousPhoto() {
      const prevIndex = this.currentPhotoIndex === 0 ? this.photos.length - 1 : this.currentPhotoIndex - 1;
      this.scrollToPhoto(prevIndex);
    },
    togglePhotoFullscreen(index:number) {
      this.currentPhotoIndex = index;
      this.photoFullscreen = !this.photoFullscreen;
    },
    trackPhotoScroll() {
      const container = document.getElementById('photos-container');
      if (container) {
        const containerWidth = container.offsetWidth;
        const scrollLeft = container.scrollLeft;
        const cardWidth = (container.children[0] as HTMLElement | undefined)?.offsetWidth || containerWidth;
        const gap = 8; // 2 * 0.5rem gap
        const newIndex = Math.round(scrollLeft / (cardWidth + gap));
        
        if (newIndex !== this.currentPhotoIndex && newIndex >= 0 && newIndex < this.photos.length) {
          this.currentPhotoIndex = newIndex;
        }
      }
    },
    setupPhotoScrollTracking() {
      const container = document.getElementById('photos-container');
      if (container) {
        // Remove existing listener if any
        container.removeEventListener('scroll', this.trackPhotoScroll);
        // Add scroll tracking
        container.addEventListener('scroll', this.trackPhotoScroll.bind(this));
      }
    }
  },
  mounted() {
    // Update time every second
    this.timeTimer = setInterval(() => {
      this.updateTime();
    }, 1000);
    
    // Set up photo scroll tracking if starting on photos face
    if (this.currentFace === 'photos') {
      setTimeout(() => this.setupPhotoScrollTracking(), 100);
    }
  },
  unmounted() {
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
    }
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
});




// Compact Showcase Container 
XTool.registerComponent({
  name: 'interactive-showcase',
  template: html`
    <div class="w-full max-w-md mx-auto">
      <div class="rounded-xl overflow-hidden">
        <!-- Header -->
        <div class="border-b border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-gray-300">X-Tool Demo</span>
            </div>
            
            <div class="flex items-center gap-3">
              <!-- Enhanced Toggle Switch -->
              <div class="flex items-center gap-2">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" x-model="isFrozen" class="sr-only peer">
                  <div class="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-400 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
                <div class="flex items-center gap-1 text-xs">
                  <div x-show="!isFrozen" class="flex items-center gap-1 text-green-400">
                    <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span class="font-medium">Live</span>
                  </div>
                  <div x-show="isFrozen" class="flex items-center gap-1 text-yellow-400">
                    <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span class="font-medium">Frozen</span>
                  </div>
                </div>
              </div>
              
              <div class="text-xs px-2 py-1 border border-gray-600 rounded bg-gray-800 text-gray-300">
                ⌚ Apple Watch Demo
              </div>
            </div>
          </div>
        </div>

        <!-- Component display -->
        <div class="p-4">
          <component x:source="'apple-watch'" x-bind:readonly="isFrozen"></component>
        </div>
      </div>
    </div>
  `,
  makeData: () => ({
    isFrozen: false
  })
});