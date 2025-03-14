import { getWebIdDataset } from '@inrupt/solid-client'

// isWebId function
export async function isWebId(uri: URL): Promise<boolean> {
  try {
    const dataset = await getWebIdDataset(uri.href)
    return dataset !== null
  } catch (error) {
    return false
  }
}
