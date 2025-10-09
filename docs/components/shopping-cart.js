// Advanced Shopping Cart (extracted)
XTool.registerComponent({
  name: 'shopping-cart',
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Shopping Cart</h3>
      <!-- Product Catalog -->
      <div class="mb-6">
        <h4 class="font-medium text-gray-700 mb-3">Available Products</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div x-for="product in products" 
               class="border rounded-lg p-3 flex justify-between items-center">
            <div>
              <div class="font-medium" x-text="product.name"></div>
              <div class="text-sm text-gray-600" x-text="formatCurrency(product.price)"></div>
            </div>
            <button x-on:click="addToCart(product)" 
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
      <!-- Cart Items -->
      <div x-if="cartItems.length > 0" class="mb-6">
        <h4 class="font-medium text-gray-700 mb-3">Cart Items</h4>
        <div class="space-y-2">
          <div x-for="item in cartItems" 
               class="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div class="flex-1">
              <div class="font-medium" x-text="item.name"></div>
              <div class="text-sm text-gray-600">
                <span x-text="formatCurrency(item.price)"></span> × 
                <span x-text="item.quantity"></span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button x-on:click="updateQuantity(item.id, item.quantity - 1)"
                      class="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm">-</button>
              <span x-text="item.quantity" class="w-8 text-center"></span>
              <button x-on:click="updateQuantity(item.id, item.quantity + 1)"
                      class="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded text-sm">+</button>
              <button x-on:click="removeFromCart(item.id)"
                      class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm ml-2">×</button>
            </div>
          </div>
        </div>
      </div>
      <!-- Discount Code -->
      <div x-if="cartItems.length > 0" class="mb-4">
        <div class="flex flex-wrap gap-2">
          <input x-model="discountCode" 
                 type="text" 
                 placeholder="Discount code"
                 class="min-w-[160px] flex-1 border rounded px-3 py-2">
          <button x-on:click="applyDiscount" 
                  class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Apply
          </button>
        </div>
        <div x-if="appliedDiscount" class="text-green-600 text-sm mt-1">
          Discount applied: <span x-text="appliedDiscount.name"></span> 
          (-<span x-text="appliedDiscount.amount"></span>%)
        </div>
        <div class="mt-3">
          <div class="text-xs uppercase tracking-wide text-gray-500 mb-1">Available Codes</div>
          <div class="flex flex-wrap gap-2">
            <button 
              x-for="dc in discountCodesList"
              x-on:click="applyCode(dc.code)"
              class="px-2 py-1 rounded text-xs border border-gray-300 hover:bg-gray-100 flex items-center gap-1"
              x:class="{ 'bg-green-500 text-white border-green-500': appliedDiscount && appliedDiscount.name === dc.name }">
              <span x-text="dc.code"></span>
              <span class="text-gray-400" x-text="'(' + dc.amount + '%)'" x:class="{ 'text-white/80': appliedDiscount && appliedDiscount.name === dc.name }"></span>
            </button>
          </div>
        </div>
      </div>
      <!-- Cart Summary -->
      <div x-if="cartItems.length > 0" class="border-t pt-4">
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span x-text="formatCurrency(subtotal)"></span>
          </div>
          <div x-if="discountAmount > 0" class="flex justify-between text-green-600">
            <span>Discount:</span>
            <span x-text="'-' + formatCurrency(discountAmount)"></span>
          </div>
          <div class="flex justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span x-text="formatCurrency(totalAmount)"></span>
          </div>
        </div>
  <div class="mt-4 flex flex-wrap gap-2">
    <button x-on:click="checkout" 
      class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded">
            Checkout
          </button>
          <button x-on:click="clearCart" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Clear Cart
          </button>
        </div>
      </div>
      <div x-if="cartItems.length === 0" class="text-center text-gray-500 py-8">
        Your cart is empty
      </div>
    </div>
  `,
  data: {
    products: [
      { id: 1, name: 'MacBook Pro', price: 1999.99 },
      { id: 2, name: 'iPhone 15', price: 999.99 },
      { id: 3, name: 'AirPods Pro', price: 249.99 },
      { id: 4, name: 'iPad Air', price: 599.99 },
      { id: 5, name: 'Apple Watch', price: 399.99 },
      { id: 6, name: 'Magic Mouse', price: 79.99 }
    ],
    cartItems: [],
    discountCode: '',
    appliedDiscount: null,
    discountCodes: {
      'SAVE10': { name: 'Save 10%', amount: 10 },
      'SAVE20': { name: 'Save 20%', amount: 20 },
      'WELCOME': { name: 'Welcome Discount', amount: 15 }
    }
  },
  computed: {
    subtotal() { return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0); },
    discountAmount() { return !this.appliedDiscount ? 0 : this.subtotal * (this.appliedDiscount.amount / 100); },
    totalAmount() { return this.subtotal - this.discountAmount; },
    discountCodesList() { return Object.keys(this.discountCodes).map(code => ({ code, ...this.discountCodes[code] })); }
  },
  methods: {
    addToCart(product) {
      const existingItem = this.cartItems.find(item => item.id === product.id);
      if (existingItem) existingItem.quantity++; else this.cartItems.push({ ...product, quantity: 1 });
    },
    removeFromCart(productId) { this.cartItems = this.cartItems.filter(item => item.id !== productId); },
    updateQuantity(productId, newQuantity) {
      if (newQuantity <= 0) { this.removeFromCart(productId); return; }
      const item = this.cartItems.find(item => item.id === productId);
      if (item) { item.quantity = newQuantity; }
    },
    applyDiscount() {
      const discount = this.discountCodes[this.discountCode.toUpperCase()];
      if (discount) { this.appliedDiscount = discount; this.discountCode = ''; } else { alert('Invalid discount code'); }
    },
    applyCode(code) { this.discountCode = code; this.applyDiscount(); },
    formatCurrency(amount) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount); },
    checkout() { alert(`Order placed! Total: ${this.formatCurrency(this.totalAmount)}`); this.clearCart(); },
    clearCart() { this.cartItems = []; this.appliedDiscount = null; this.discountCode = ''; }
  }
});
