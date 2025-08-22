import type {
  IDataObject,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

// A simple in‑memory cache for article metadata. When the validate endpoint is
// called via getInputPqs/getOutputPqs the returned metadata is stored here
// keyed by articleId. Subsequent calls to load units for a given PQ can
// retrieve the metadata locally without performing an additional network
// request. Note: this cache is not persisted across server restarts and is
// shared across all instances of this node.
const metadataCache: Record<string, any> = {};

/**
 * Custom n8n node for interacting with calculation articles.
 *
 * This node implements two operations based on the provided API reference:
 *  - Validate: Retrieves metadata about a calculation article including input and output
 *    physical quantities (PQs) and their available units. Use this operation to
 *    dynamically populate the input/output selectors.
 *  - Calculate: Performs a stateless calculation given input PQ values and
 *    optionally returns selected output PQs in user‑specified units.
 *
 * To use this node you must configure a Calculation API credential with your
 * base URL and API key. The node makes GET and POST requests directly
 * to the endpoints described in the API reference. If an error is returned
 * (non‑200 status code) the node will throw an exception and stop the workflow.
 */
export class Calculation implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Calculation',
    name: 'calculation',
    icon: 'fa:calculator',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter.operation === "validate" ? "Validate article" : "Calculate values"}}',
    description: 'Interact with calculation articles via the validate and calculate API endpoints.',
    defaults: {
      name: 'Calculation',
    },
    // Use an assertion to satisfy the type system. n8n expects arrays of
    // NodeConnectionType strings but we avoid importing additional types here.
    inputs: ['main'] as any,
    outputs: ['main'] as any,
    credentials: [
      {
        name: 'calculationApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Validate',
            value: 'validate',
            description: 'Validate the article and retrieve PQ metadata',
          },
          {
            name: 'Calculate',
            value: 'calculate',
            description: 'Perform a calculation with specified inputs and outputs',
          },
        ],
        default: 'validate',
      },
      {
        displayName: 'Article ID',
        name: 'articleId',
        type: 'string',
        default: '',
        required: true,
        description: 'The ID of the calculation article (short ID or UUID).',
      },
      // Region: Validate specific fields
      {
        displayName: 'Raw Response',
        name: 'rawResponse',
        type: 'boolean',
        default: false,
        description: 'Return the full response from the validate endpoint instead of only metadata.',
        displayOptions: {
          show: {
            operation: ['validate'],
          },
        },
      },
      // Region: Calculate specific fields
      {
        displayName: 'Selected Input PQs',
        name: 'inputs',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        placeholder: 'Add Input PQ',
        default: {},
        options: [
          {
            name: 'input',
            displayName: 'Input PQ',
            values: [
              {
                displayName: 'PQ Symbol',
                name: 'symbol',
                type: 'options',
                options: [],
                default: '',
                description:
                  'Select the physical quantity you want to provide a value for. Loaded from the article metadata.',
                typeOptions: {
                  loadOptionsMethod: 'getInputPqs',
                },
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'number',
                default: 0,
                description: 'Numeric value for the selected PQ.',
              },
              {
                displayName: 'Unit',
                name: 'unit',
                type: 'options',
                options: [],
                default: '',
                description:
                  'Unit for the value. Only units compatible with the selected PQ are shown.',
                // Load units dynamically based on the selected PQ symbol. When the symbol
                // changes the list of units will refresh. If the metadata has not
                // been loaded yet the dropdown may be empty until validate is called.
                typeOptions: {
                  loadOptionsMethod: 'getUnitsForInput',
                  loadOptionsDependsOn: ['symbol'],
                },
              },
            ], // values
          },
        ], // options
        displayOptions: {
          show: {
            operation: ['calculate'],
          },
        },
      }, // inputs
      {
        displayName: 'Selected Output PQs',
        name: 'outputs',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        placeholder: 'Add Output PQ',
        default: {},
        options: [
          {
            name: 'output',
            displayName: 'Output PQ',
            values: [
              {
                displayName: 'PQ Symbol',
                name: 'symbol',
                type: 'options',
                options: [],
                default: '',
                description:
                  'Select which physical quantity you want returned from the calculation. Loaded from the article metadata.',
                typeOptions: {
                  loadOptionsMethod: 'getOutputPqs',
                },
              },
              {
                displayName: 'Unit',
                name: 'unit',
                type: 'options',
                options: [],
                default: '',
                description:
                  'Preferred unit for the output value. Leave empty to use the article\'s default unit. Only units compatible with the selected PQ are shown.',
                typeOptions: {
                  loadOptionsMethod: 'getUnitsForOutput',
                  loadOptionsDependsOn: ['symbol'],
                },
              },
            ], // values
          }, // options
        ],
        displayOptions: {
          show: {
            operation: ['calculate'],
          },
        },
      }, // outputs
    ],//properties
  }; // description

  /**
   * Dynamically loads input PQs for the given article.
   * This method is called by n8n to populate the drop‑down options when
   * selecting a physical quantity under the Inputs section. It calls the
   * validate endpoint using the configured credentials and article ID and
   * returns an array of options with both the symbol and a human readable
   * description.
   */
  methods = {
    loadOptions: {
      async getInputPqs(this: any): Promise<INodePropertyOptions[]> {
        console.log(`@getInputPQs`)
        console.log(`metadataCache: ${metadataCache}`)
        console.log(JSON.stringify(metadataCache, null, 2))
        console.dir(metadataCache)
        const articleId = this.getCurrentNodeParameter('articleId') as string;
        if (!articleId) {
          return [];
        }
        const credentials = (await this.getCredentials('calculationApi')) as {
          baseUrl: string;
          apiKey: string;
        };
        const baseUrl = (credentials.baseUrl || '').replace(/\/?$/, '');
        const apiKey = credentials.apiKey;
        const qs = {
          articleId,
          apiKey,
        };
        const options = {
          method: 'GET' as const,
          url: `${baseUrl}/api/n8n/validate`,
          qs,
          json: true,
        };
        let response;
        try {
          response = await this.helpers.httpRequest!(options);
        } catch (error) {
          // If the request fails we return an empty list of options
          return [];
        }
        // Store metadata in the cache for later use
        if (response?.metadata) {
          metadataCache[articleId] = response.metadata;
        }
        const result: INodePropertyOptions[] = [];
        const inputPQs = response?.metadata?.inputPQs;
        if (Array.isArray(inputPQs)) {
          for (const pq of inputPQs) {
            const labelParts: string[] = [];
            if (pq.symbol) labelParts.push(pq.symbol);
            if (pq.description) labelParts.push(pq.description);
            if (pq.unit) labelParts.push(`(${pq.unit})`);
            result.push({
              name: labelParts.join(' - '),
              value: pq.symbol,
              description: pq.description || pq.symbol,
            });
          }
        }
        return result;
      }, // getInputPQs
      /**
       * Dynamically loads output PQs for the given article.
       */
      async getOutputPqs(this: any): Promise<INodePropertyOptions[]> {
        const articleId = this.getCurrentNodeParameter('articleId') as string;
        if (!articleId) {
          return [];
        }
        const credentials = (await this.getCredentials('calculationApi')) as {
          baseUrl: string;
          apiKey: string;
        };
        const baseUrl = (credentials.baseUrl || '').replace(/\/?$/, '');
        const apiKey = credentials.apiKey;
        const qs = { articleId, apiKey };
        const options = {
          method: 'GET' as const,
          url: `${baseUrl}/api/n8n/validate`,
          qs,
          json: true,
        };
        let response;
        try {
          response = await this.helpers.httpRequest!(options);
        } catch (error) {
          return [];
        }
        if (response?.metadata) {
          metadataCache[articleId] = response.metadata;
        }
        const result: INodePropertyOptions[] = [];
        const outputPQs = response?.metadata?.outputPQs;
        if (Array.isArray(outputPQs)) {
          for (const pq of outputPQs) {
            const labelParts: string[] = [];
            if (pq.symbol) labelParts.push(pq.symbol);
            if (pq.description) labelParts.push(pq.description);
            if (pq.unit) labelParts.push(`(${pq.unit})`);
            result.push({
              name: labelParts.join(' - '),
              value: pq.symbol,
              description: pq.description || pq.symbol,
            });
          }
        }
        return result;
      }, // getOutputPqs
      /**
       * Returns a flattened list of all available units for the current article.
       * Each unit will appear as both name and value. If multiple categories
       * contain the same unit it will only be shown once.
       */
      async getUnits(this: any): Promise<INodePropertyOptions[]> {
        const articleId = this.getCurrentNodeParameter('articleId') as string;
        if (!articleId) {
          return [];
        }
        let availableUnits: any;
        // Try to read from cache first
        if (metadataCache[articleId]) {
          availableUnits = metadataCache[articleId].availableUnits;
        }
        // If not cached, attempt a network call to retrieve the units
        if (!availableUnits) {
          const credentials = (await this.getCredentials('calculationApi')) as {
            baseUrl: string;
            apiKey: string;
          };
          const baseUrl = (credentials.baseUrl || '').replace(/\/?$/, '');
          const apiKey = credentials.apiKey;
          const qs = { articleId, apiKey };
          const options = {
            method: 'GET' as const,
            url: `${baseUrl}/api/n8n/validate`,
            qs,
            json: true,
          };
          let response;
          try {
            response = await this.helpers.httpRequest!(options);
          } catch (error) {
            availableUnits = undefined;
          }
          if (response?.metadata) {
            metadataCache[articleId] = response.metadata;
            availableUnits = response.metadata.availableUnits;
          }
        }
        const unitsMap: Record<string, true> = {};
        if (availableUnits && typeof availableUnits === 'object') {
          for (const category of Object.values(availableUnits) as unknown as string[][]) {
            if (Array.isArray(category)) {
              for (const unit of category) {
                unitsMap[unit] = true;
              }
            }
          }
        }
        if (Object.keys(unitsMap).length === 0) {
          ['m', 's', 'kg', 'A', 'K', 'mol', 'cd'].forEach((u) => {
            unitsMap[u] = true;
          });
        }
        return Object.keys(unitsMap).map((unit) => ({ name: unit, value: unit }));
      }, // getUnits

      /**
       * Returns the units available for a specific input PQ. This function
       * looks up the selected symbol in the article metadata and returns
       * the corresponding units from the availableUnits map. If no match is
       * found it falls back to a flattened list of all units.
       */
      async getUnitsForInput(this: any): Promise<INodePropertyOptions[]> {
        const articleId = this.getCurrentNodeParameter('articleId') as string;
        const symbol = this.getCurrentNodeParameter('symbol') as string;
        if (!articleId || !symbol) {
          return [];
        }
        // Attempt to read metadata from cache instead of performing a network call
        const metadata = metadataCache[articleId];
        if (metadata) {
          const inputPQs = metadata.inputPQs;
          const availableUnits = metadata.availableUnits;
          let categoryId: string | undefined;
          if (Array.isArray(inputPQs)) {
            for (const pq of inputPQs) {
              if (pq.symbol === symbol) {
                categoryId = pq.categoryId;
                break;
              }
            }
          }
          if (categoryId && availableUnits && availableUnits[categoryId]) {
            const units: string[] = availableUnits[categoryId] as string[];
            return units.map((u) => ({ name: u, value: u }));
          }
          // Fallback to aggregated list from metadata
          const unitsMap: Record<string, true> = {};
          if (availableUnits && typeof availableUnits === 'object') {
            for (const category of Object.values(availableUnits) as unknown as string[][]) {
              if (Array.isArray(category)) {
                for (const unit of category) {
                  unitsMap[unit] = true;
                }
              }
            }
          }
          if (Object.keys(unitsMap).length > 0) {
            return Object.keys(unitsMap).map((unit) => ({ name: unit, value: unit }));
          }
        } // if metadata
        // If nothing is cached, return an empty list so the dropdown doesn\'t break
        return [];
      }, // getUnitsForInput

      /**
       * Returns the units available for a specific output PQ.
       */
      async getUnitsForOutput(this: any): Promise<INodePropertyOptions[]> {
        const articleId = this.getCurrentNodeParameter('articleId') as string;
        const symbol = this.getCurrentNodeParameter('symbol') as string;
        if (!articleId || !symbol) {
          return [];
        }
        // Attempt to read metadata from cache instead of performing a network call
        const metadata = metadataCache[articleId];
        if (metadata) {
          const outputPQs = metadata.outputPQs;
          const availableUnits = metadata.availableUnits;
          let categoryId: string | undefined;
          if (Array.isArray(outputPQs)) {
            for (const pq of outputPQs) {
              if (pq.symbol === symbol) {
                categoryId = pq.categoryId;
                break;
              }
            }
          }
          if (categoryId && availableUnits && availableUnits[categoryId]) {
            const units: string[] = availableUnits[categoryId] as string[];
            return units.map((u) => ({ name: u, value: u }));
          }
          // Fallback to aggregated list from metadata
          const unitsMap: Record<string, true> = {};
          if (availableUnits && typeof availableUnits === 'object') {
            for (const category of Object.values(availableUnits) as unknown as string[][]) {
              if (Array.isArray(category)) {
                for (const unit of category) {
                  unitsMap[unit] = true;
                }
              }
            }
          }
          if (Object.keys(unitsMap).length > 0) {
            return Object.keys(unitsMap).map((unit) => ({ name: unit, value: unit }));
          }
        } // if (metadata)
        // If nothing is cached, return an empty list so the dropdown doesn\'t break
        return [];
      }, // getUnitsForOutput
    }, // loadOptions
  }; // methods

  /**
   * Execute the node.
   * n8n passes input items to the node which are processed one by one.
   * Depending on the selected operation (validate or calculate) different
   * HTTP requests are made and the results are returned as output data.
   */
  async execute(this: any): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;
    for (let i = 0; i < items.length; i++) {
      const articleId = this.getNodeParameter('articleId', i) as string;
      const credentials = (await this.getCredentials('calculationApi')) as {
        baseUrl: string;
        apiKey: string;
      };
      const baseUrl = (credentials.baseUrl || '').replace(/\/?$/, '');
      const apiKey = credentials.apiKey;
      if (operation === 'validate') {
        const qs = {
          articleId,
          apiKey,
        };
        const options = {
          method: 'GET' as const,
          url: `${baseUrl}/api/n8n/validate`,
          qs,
          json: true,
        };
        let responseData: any;
        try {
          responseData = await this.helpers.httpRequest!(options);
        } catch (error) {
          // Pass the error message upstream so an Error Trigger node can catch it
          const err: any = error;
          throw new Error(
            `Calculation validate request failed: ${err?.message || err?.toString?.() || err}`,
          );
        }
        const rawResponse = this.getNodeParameter('rawResponse', i) as boolean;
        if (rawResponse) {
          returnData.push({ json: responseData });
        } else {
          returnData.push({ json: responseData?.metadata || {} });
        }
      } else if (operation === 'calculate') {
        // Retrieve metadata from the in‑memory cache or via the validate endpoint
        let metadata: any = metadataCache[articleId];
        if (!metadata) {
          try {
            const validateOptions = {
              method: 'GET' as const,
              url: `${baseUrl}/api/n8n/validate`,
              qs: { articleId, apiKey },
              json: true,
            };
            const validateResponse = await this.helpers.httpRequest!(validateOptions);
            metadata = validateResponse?.metadata;
            if (metadata) {
              metadataCache[articleId] = metadata;
            }
          } catch (error) {
            const err: any = error;
            throw new Error(
              `Unable to load article metadata for calculation: ${err?.message || err?.toString?.() || err}`,
            );
          }
        }
        const inputPqMap: Record<string, any> = {};
        const outputPqMap: Record<string, any> = {};
        if (metadata) {
          if (Array.isArray(metadata.inputPQs)) {
            for (const pq of metadata.inputPQs) {
              inputPqMap[pq.symbol] = pq;
            }
          }
          if (Array.isArray(metadata.outputPQs)) {
            for (const pq of metadata.outputPQs) {
              outputPqMap[pq.symbol] = pq;
            }
          }
        }
        // Build inputs object with defaults where appropriate
        const inputsCollection = this.getNodeParameter('inputs', i, {}) as IDataObject;
        const inputs: Record<string, { value: number; unit: string }> = {};
        if (inputsCollection && inputsCollection.input) {
          const inputArray = inputsCollection.input as IDataObject[];
          for (const entry of inputArray) {
            const symbol = entry.symbol as string;
            let value = entry.value as number | undefined;
            let unit = entry.unit as string | undefined;
            const defaultPq = inputPqMap[symbol];
            if (defaultPq) {
              // Use the article\'s faceValue and unit when user has not provided their own
              if ((value === undefined || value === null || value === ('' as any))) {
                if (typeof defaultPq.faceValue === 'number') {
                  value = defaultPq.faceValue;
                }
              }
              if (!unit && defaultPq.unit) {
                unit = defaultPq.unit;
              }
            }
            if (symbol) {
              inputs[symbol] = {
                value: value as number,
                unit: (unit || '') as string,
              };
            }
          }
        }
        // Build outputs object with defaults where appropriate
        const outputsCollection = this.getNodeParameter('outputs', i, {}) as IDataObject;
        const outputs: Record<string, { unit?: string }> = {};
        if (outputsCollection && outputsCollection.output) {
          const outputArray = outputsCollection.output as IDataObject[];
          for (const entry of outputArray) {
            const symbol = entry.symbol as string;
            let unit = entry.unit as string | undefined;
            const defaultPq = outputPqMap[symbol];
            if (!unit && defaultPq && defaultPq.unit) {
              unit = defaultPq.unit;
            }
            if (symbol) {
              outputs[symbol] = {};
              if (unit) {
                outputs[symbol].unit = unit;
              }
            }
          }
        }
        const body: IDataObject = {
          articleId,
          apiKey,
          inputs,
        };
        if (Object.keys(outputs).length > 0) {
          body.outputs = outputs;
        }
        const calcOptions = {
          method: 'POST' as const,
          url: `${baseUrl}/api/n8n/calculate`,
          body,
          json: true,
        };
        let responseData: any;
        try {
          responseData = await this.helpers.httpRequest!(calcOptions);
        } catch (error) {
          const err: any = error;
          throw new Error(
            `Calculation request failed: ${err?.message || err?.toString?.() || err}`,
          );
        }
        returnData.push({ json: responseData });
      }
    } // for loop
    return [returnData];
  } // execute
}