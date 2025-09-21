export const createReportSchema = {
  type: 'object',
  required: ['inputs'],
  properties: {
    branding: {
      type: 'object',
      properties: {
        logoUrl: { type:'string' },
        companyName: { type:'string' }
      },
      additionalProperties: true
    },
    delivery: {
      type:'object',
      properties: {
        email: { type:'string', format:'email' },
        sendAttachment: { type:'boolean' },
        webhookUrl: { type:'string' },
        webhookSecret: { type:'string' }
      }
    },
    inputs: {
      type:'object',
      required:['orientation','stone','moduleH','moduleW','moduleWeight','windZone','terrain','height','roofType'],
      properties:{
        project: {
          type:'object',
          properties:{ name:{type:'string'}, street:{type:'string'}, plz:{type:'string'}, ort:{type:'string'} }
        },
        orientation:{ enum:['S','EW'] },
        ausrichtung:{ enum:['1','2'] },
        stone:{ enum:['0','6','10V1','10V2','10XL','15'] },
        moduleH:{ type:'number' }, moduleW:{ type:'number' }, moduleWeight:{ type:'number' },
        windZone:{ enum:[1,2,3,4] }, terrain:{ enum:[1,2,3,4] },
        height:{ type:'number' },
        roofType:{ enum:['bitumen','kies','pvc','epdm','beton'] }
      },
      additionalProperties:false
    },
    options: {
      type:'object',
      properties:{ language:{ enum:['de','en'] }, attachCpTable:{ type:'boolean' } },
      additionalProperties:true
    }
  },
  additionalProperties:false
} as const;
