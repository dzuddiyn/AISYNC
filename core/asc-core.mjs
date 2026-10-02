const CONTRACT_FIELDS = Object.freeze([
  'Project',
  'Source method',
  'Operation',
  'Record type',
  'Record ID',
  'Content/change',
  'Lineage',
  'Destination'
]);

const DESTINATION_ADAPTERS = Object.freeze({
  GitHub: 'github',
  ASC_DB: 'asc_db'
});

function cloneSemanticValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneSemanticValue);
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value).reduce(function (copy, key) {
      copy[key] = cloneSemanticValue(value[key]);
      return copy;
    }, {});
  }

  return value;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

function hasUniqueStrings(values) {
  return values.every(isNonEmptyString) && new Set(values).size === values.length;
}

function validationError(code, field, message) {
  return { code, field, message };
}

export function validateContract(contract) {
  const errors = [];

  if (contract === null || typeof contract !== 'object' || Array.isArray(contract)) {
    return {
      valid: false,
      errors: [validationError('INVALID_TYPE', null, 'Contract must be an object.')]
    };
  }

  const actualFields = Object.keys(contract);
  const expectedFields = new Set(CONTRACT_FIELDS);

  CONTRACT_FIELDS.forEach(function (field) {
    if (!Object.prototype.hasOwnProperty.call(contract, field)) {
      errors.push(validationError('MISSING_FIELD', field, 'Required field is missing.'));
    }
  });

  actualFields.forEach(function (field) {
    if (!expectedFields.has(field)) {
      errors.push(validationError('EXTRA_FIELD', field, 'Top-level field is not allowed.'));
    }
  });

  ['Project', 'Source method', 'Operation', 'Record type', 'Record ID'].forEach(function (field) {
    if (Object.prototype.hasOwnProperty.call(contract, field) && !isNonEmptyString(contract[field])) {
      errors.push(validationError('INVALID_STRING', field, 'Value must be a non-empty string.'));
    }
  });

  if (Object.prototype.hasOwnProperty.call(contract, 'Content/change')) {
    const content = contract['Content/change'];
    const validContent = isNonEmptyString(content) ||
      Array.isArray(content) ||
      (content !== null && typeof content === 'object');

    if (!validContent) {
      errors.push(validationError(
        'INVALID_CONTENT',
        'Content/change',
        'Value must be an object, array, or non-empty string.'
      ));
    }
  }

  if (Object.prototype.hasOwnProperty.call(contract, 'Lineage')) {
    if (!Array.isArray(contract.Lineage)) {
      errors.push(validationError('INVALID_ARRAY', 'Lineage', 'Value must be an array.'));
    } else if (!hasUniqueStrings(contract.Lineage)) {
      errors.push(validationError(
        'INVALID_LINEAGE',
        'Lineage',
        'Items must be unique non-empty strings.'
      ));
    }
  }

  if (Object.prototype.hasOwnProperty.call(contract, 'Destination')) {
    if (!Array.isArray(contract.Destination) || contract.Destination.length === 0) {
      errors.push(validationError(
        'INVALID_DESTINATION',
        'Destination',
        'Value must contain at least one destination.'
      ));
    } else if (!hasUniqueStrings(contract.Destination)) {
      errors.push(validationError(
        'INVALID_DESTINATION',
        'Destination',
        'Items must be unique non-empty strings.'
      ));
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function authorizeRequest(contract, authorizationContext, authorizationPolicy) {
  if (typeof authorizationPolicy !== 'function') {
    return {
      authorized: false,
      errors: [{ code: 'AUTHORIZATION_POLICY_REQUIRED', message: 'Authorization policy is required.' }]
    };
  }

  let decision;
  try {
    decision = authorizationPolicy(
      cloneSemanticValue(contract),
      authorizationContext
    );
  } catch (error) {
    return {
      authorized: false,
      errors: [{ code: 'AUTHORIZATION_POLICY_ERROR', message: 'Authorization policy failed.' }]
    };
  }

  if (!decision || decision.authorized !== true) {
    return {
      authorized: false,
      errors: [{ code: 'AUTHORIZATION_DENIED', message: 'Authorization policy did not authorize the request.' }]
    };
  }

  return {
    authorized: true,
    errors: []
  };
}

export function routeDestinations(contract) {
  const routes = [];

  for (const destination of contract.Destination) {
    const adapterId = DESTINATION_ADAPTERS[destination];
    if (!adapterId) {
      return {
        routed: false,
        routes: [],
        error: {
          code: 'UNSUPPORTED_DESTINATION',
          destination,
          message: 'Destination is not supported by this Core proof.'
        }
      };
    }

    routes.push({ destination, adapterId });
  }

  return {
    routed: true,
    routes,
    error: null
  };
}

export function createAdapterInvocation(contract, route) {
  return {
    destination: route.destination,
    adapterId: route.adapterId,
    contract: cloneSemanticValue(contract)
  };
}

export function createReceiptLayerHandoff(adapterResult) {
  return {
    kind: 'ADAPTER_RESULT_TO_RECEIPT_LAYER',
    adapterResult: cloneSemanticValue(adapterResult)
  };
}

export function processCoreRequest({
  contract,
  authorizationContext,
  authorizationPolicy
}) {
  const validation = validateContract(contract);

  if (!validation.valid) {
    return {
      status: 'REJECTED',
      stage: 'VALIDATION',
      validation
    };
  }

  const authorization = authorizeRequest(
    contract,
    authorizationContext,
    authorizationPolicy
  );

  if (!authorization.authorized) {
    return {
      status: 'REJECTED',
      stage: 'AUTHORIZATION',
      validation,
      authorization
    };
  }

  const preservedContract = cloneSemanticValue(contract);
  const routing = routeDestinations(preservedContract);

  if (!routing.routed) {
    return {
      status: 'REJECTED',
      stage: 'ROUTING',
      validation,
      authorization,
      routing,
      contract: preservedContract
    };
  }

  const adapterInvocations = routing.routes.map(function (route) {
    return createAdapterInvocation(preservedContract, route);
  });

  return {
    status: 'ACCEPTED',
    stage: 'CORE_BOUNDARY',
    validation,
    authorization,
    contract: preservedContract,
    routes: routing.routes,
    adapterInvocations,
    receiptLayerHandoff: {
      kind: 'ADAPTER_RESULTS_PENDING_RECEIPT_LAYER',
      adapterResults: []
    }
  };
}
