class Needleman_Wunsch(object):

    def __init__(self):
        return

    @staticmethod
    def align(seq1, seq2):
        # initialize the gap matrix
        M = len(seq1)+1
        N = len(seq2)+1

        gapMatrix = [[0 for x in range(N)] for x in range(M)]
        # initialize the first row and column to 0
        for i in range(0, max(M,N)):
            if i < M: gapMatrix[i][0] = 0
            if i < N: gapMatrix[0][i] = 0

        # iterate over both sequences
        for row in range(1, M):
            for col in range(1,N):
                # compare the two residues
                score = 2 if (seq1[row-1] == seq2[col-1]) else -1
                # gap score (currently ignoring)
                w = -2

                # set the matrix value based on:
                # M[i,j] = max( M[i-1,j-1] + score ,
                #           M[i,j-1] + w, M[i-1,j] + w)
                gapMatrix[row][col] = max( gapMatrix[row-1][col-1] + score,
                    max(gapMatrix[row][col-1] + w, gapMatrix[row-1][col] + w))
        print gapMatrix

        # TODO Implement the reconstruction
