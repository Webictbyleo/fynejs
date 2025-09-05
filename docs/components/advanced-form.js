// Advanced Form with Validation and Multi-step (extracted)
XTool.registerComponent({
  name: 'advanced-form',
  template: html`
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto">
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Multi-Step Form</h3>
        <!-- Progress Bar -->
        <div class="flex items-center mb-4">
          <div 
            x-for="(step, index) in steps"
            class="flex items-center">
            <div 
              x:class="{ 
                'bg-blue-500 text-white': index <= currentStep, 
                'bg-gray-200 text-gray-600': index > currentStep 
              }"
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors">
              {{ index + 1 }}
            </div>
            <div 
              x-if="index < steps.length - 1"
              x:class="{ 'bg-blue-500': index < currentStep, 'bg-gray-200': index >= currentStep }"
              class="w-12 h-1 mx-2 transition-colors">
            </div>
          </div>
        </div>
      </div>

      <form x-on:submit.prevent="handleSubmit">
        <!-- Step 1: Personal Info -->
        <div x-show="currentStep === 0" class="space-y-4">
          <h4 class="font-medium text-gray-800">Personal Information</h4>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input 
              type="text" 
              x-model="form.firstName"
              x:class="{ 'border-red-500': errors.firstName, 'border-gray-300': !errors.firstName }"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <span x-if="errors.firstName" class="text-red-500 text-sm" x-text="errors.firstName"></span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input 
              type="text" 
              x-model="form.lastName"
              x:class="{ 'border-red-500': errors.lastName, 'border-gray-300': !errors.lastName }"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <span x-if="errors.lastName" class="text-red-500 text-sm" x-text="errors.lastName"></span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              x-model="form.email"
              x:class="{ 'border-red-500': errors.email, 'border-gray-300': !errors.email }"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <span x-if="errors.email" class="text-red-500 text-sm" x-text="errors.email"></span>
          </div>
        </div>

        <!-- Step 2: Preferences -->
        <div x-show="currentStep === 1" class="space-y-4">
          <h4 class="font-medium text-gray-800">Preferences</h4>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Interests</label>
            <div class="space-y-2">
              <label 
                x-for="interest in availableInterests"
                class="flex items-center">
                <input 
                  type="checkbox" 
                  x-model="form.interests"
                  class="mr-2">
                <span x-text="interest"></span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
            <select 
              x-model="form.experience"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <!-- Step 3: Review -->
        <div x-show="currentStep === 2" class="space-y-4">
          <h4 class="font-medium text-gray-800">Review Your Information</h4>
          <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div><strong>Name:</strong> {{ form.firstName }} {{ form.lastName }}</div>
            <div><strong>Email:</strong> {{ form.email }}</div>
            <div><strong>Interests:</strong> {{ form.interests.join(', ') || 'None selected' }}</div>
            <div><strong>Experience:</strong> {{ form.experience || 'Not specified' }}</div>
          </div>
          <div class="flex items-center">
            <input 
              type="checkbox" 
              x-model="form.agreeToTerms"
              class="mr-2">
            <label class="text-sm text-gray-700">I agree to the terms and conditions</label>
          </div>
          <span x-if="errors.agreeToTerms" class="text-red-500 text-sm" x-text="errors.agreeToTerms"></span>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <button 
            type="button"
            x-if="currentStep > 0"
            x-on:click="previousStep"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Previous
          </button>
          <div x-if="currentStep === 0" class="w-20"></div>
          <button 
            x-if="currentStep < steps.length - 1"
            type="button"
            x-on:click="nextStep"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Next
          </button>
          <button 
            x-if="currentStep === steps.length - 1"
            type="submit"
            x:disabled="!form.agreeToTerms"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Submit
          </button>
        </div>
      </form>
    </div>
  `,
  makeData: () => ({
    currentStep: 0,
    steps: ['Personal', 'Preferences', 'Review'],
    availableInterests: ['Technology', 'Design', 'Marketing', 'Sales', 'Support'],
    form: {
      firstName: '',
      lastName: '',
      email: '',
      interests: [],
      experience: '',
      agreeToTerms: false
    },
    errors: {}
  }),
  methods: {
    validateStep(step) {
      this.errors = {};
      if (step === 0) {
        if (!this.form.firstName.trim()) this.errors.firstName = 'First name is required';
        if (!this.form.lastName.trim()) this.errors.lastName = 'Last name is required';
        if (!this.form.email.trim()) {
          this.errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(this.form.email)) {
          this.errors.email = 'Email is invalid';
        }
      }
      if (step === 2) {
        if (!this.form.agreeToTerms) this.errors.agreeToTerms = 'You must agree to the terms';
      }
      return Object.keys(this.errors).length === 0;
    },
    nextStep() {
      if (this.validateStep(this.currentStep)) {
        this.currentStep++;
      }
    },
    previousStep() {
      this.currentStep--;
      this.errors = {};
    },
    handleSubmit() {
      if (this.validateStep(this.currentStep)) {
        alert('Form submitted successfully!\n\n' + JSON.stringify(this.form, null, 2));
      }
    }
  }
});
