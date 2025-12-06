// ESLint configuration to catch Firebase injection context issues
module.exports = {
  rules: {
    // Custom rule to detect Firebase calls inside RxJS operators
    'no-firebase-in-rxjs-callbacks': {
      create(context) {
        return {
          CallExpression(node) {
            // Check if we're inside an RxJS operator callback
            const isInRxJSCallback = checkIfInRxJSCallback(node);
            
            // Check if this is a Firebase call
            const isFirebaseCall = [
              'collection', 'collectionData', 'doc', 'docData', 
              'getDoc', 'getDocs', 'onSnapshot', 'addDoc', 
              'updateDoc', 'deleteDoc', 'setDoc'
            ].includes(node.callee.name);
            
            if (isInRxJSCallback && isFirebaseCall) {
              context.report({
                node,
                message: `Firebase API '${node.callee.name}' called inside RxJS operator callback. This may cause injection context issues. Consider restructuring to avoid Firebase calls in reactive callbacks.`
              });
            }
          }
        };
        
        function checkIfInRxJSCallback(node) {
          // Walk up the AST to find if we're in a known RxJS operator
          let parent = node.parent;
          while (parent) {
            if (parent.type === 'CallExpression' && 
                ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap', 'map', 'filter', 'tap'].includes(parent.callee.property?.name)) {
              return true;
            }
            parent = parent.parent;
          }
          return false;
        }
      }
    }
  }
};
