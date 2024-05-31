export interface FileDTO {
    path: string,
    content: string
}

export interface FinalPayload {
    ip4: string,
    ip6: string,
    files: FileDTO[]
}