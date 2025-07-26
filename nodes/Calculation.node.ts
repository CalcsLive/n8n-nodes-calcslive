import type {
  IDataObject,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

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
                  'Unit for the value. The options are aggregated from all available unit categories.',
                // Load units dynamically based on the selected PQ symbol. When the symbol
                // changes the list of units will refresh. If for some reason the
                // article does not return unit information for the selected PQ the
                // dropdown will fall back to a flattened list of all units.
                typeOptions: {
                  loadOptionsMethod: 'getUnitsForInput',
                  loadOptionsDependsOn: ['symbol'],
                },
              },
            ],
          },
        ],
        displayOptions: {
          show: {
            operation: ['calculate'],
          },
        },
      },
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
                  'Preferred unit for the output value. Leave empty to use the article\'s default unit.',
                typeOptions: {
                  loadOptionsMethod: 'getUnitsForOutput',
                  loadOptionsDependsOn: ['symbol'],
                },
              },
            ],
          },
        ],
        displayOptions: {
          show: {
            operation: ['calculate'],
          },
        },
      },
    ],
  };

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
      },
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
      },
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
        const unitsMap: Record<string, true> = {};
        const availableUnits = response?.metadata?.availableUnits;
        if (availableUnits && typeof availableUnits === 'object') {
          for (const category of Object.values(availableUnits) as unknown as string[][]) {
            if (Array.isArray(category)) {
              for (const unit of category) {
                unitsMap[unit] = true;
              }
            }
          }
        }
        // Fall back to a common set if none returned
        if (Object.keys(unitsMap).length === 0) {
          // Provide some basic SI units as a fallback
          ['m', 's', 'kg', 'A', 'K', 'mol', 'cd'].forEach((u) => {
            unitsMap[u] = true;
          });
        }
        return Object.keys(unitsMap).map((unit) => ({ name: unit, value: unit }));
      },

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
        const inputPQs = response?.metadata?.inputPQs;
        const availableUnits = response?.metadata?.availableUnits;
        // Try to find the categoryId for the selected symbol
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
        // Fallback to flattened list of all available units in the article
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
      },

      /**
       * Returns the units available for a specific output PQ.
       */
      async getUnitsForOutput(this: any): Promise<INodePropertyOptions[]> {
        const articleId = this.getCurrentNodeParameter('articleId') as string;
        const symbol = this.getCurrentNodeParameter('symbol') as string;
        if (!articleId || !symbol) {
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
        const outputPQs = response?.metadata?.outputPQs;
        const availableUnits = response?.metadata?.availableUnits;
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
        // Fallback to flattened list of all available units in the article
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
      },
    },
  };

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
        // Build inputs object
        const inputsCollection = this.getNodeParameter('inputs', i, {}) as IDataObject;
        const inputs: Record<string, { value: number; unit: string }> = {};
        if (inputsCollection && inputsCollection.input) {
          const inputArray = inputsCollection.input as IDataObject[];
          for (const entry of inputArray) {
            const symbol = entry.symbol as string;
            const value = entry.value as number;
            const unit = entry.unit as string;
            if (symbol) {
              inputs[symbol] = {
                value,
                unit: unit || '',
              };
            }
          }
        }
        // Build outputs object
        const outputsCollection = this.getNodeParameter('outputs', i, {}) as IDataObject;
        const outputs: Record<string, { unit?: string }> = {};
        if (outputsCollection && outputsCollection.output) {
          const outputArray = outputsCollection.output as IDataObject[];
          for (const entry of outputArray) {
            const symbol = entry.symbol as string;
            const unit = entry.unit as string;
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
        // Only include outputs when at least one is specified
        if (Object.keys(outputs).length > 0) {
          body.outputs = outputs;
        }
        const options = {
          method: 'POST' as const,
          url: `${baseUrl}/api/n8n/calculate`,
          body,
          json: true,
        };
        let responseData: any;
        try {
          responseData = await this.helpers.httpRequest!(options);
        } catch (error) {
          const err: any = error;
          throw new Error(
            `Calculation request failed: ${err?.message || err?.toString?.() || err}`,
          );
        }
        returnData.push({ json: responseData });
      }
    }
    return [returnData];
  }
}