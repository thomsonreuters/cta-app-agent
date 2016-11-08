'use strict';

class CancelJob {
  constructor(id) {
    const job = {
      nature: {
        type: 'execution',
        quality: 'cancel',
      },
      payload: {
        execution: {
          id: id,
        },
        mode: 'manual',
      },
    };
    return job;
  }
}

module.exports = CancelJob;
