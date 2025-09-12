import { defineComponent } from 'vue';

import { Button } from 'ant-design-vue';

export default defineComponent({
  name: 'TestComponent',
  setup() {
    return () => (
      <div>
        <Button>TestComponent</Button>
      </div>
    );
  },
});
